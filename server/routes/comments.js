const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabase');

// GET /api/comments?article_url=... hoặc ?user_id=...
router.get('/', async (req, res) => {
  const { article_url, user_id } = req.query;

  if (!article_url && !user_id) {
    return res.status(400).json({ error: 'Missing article_url or user_id' });
  }

  try {
    let query = supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        parent_id,
        root_id,
        depth,
        path,
        article_url,
        user_info (
          full_name,
          avatar_url
        ),
        articles (title)
      `)
      .eq('is_deleted', false);

    if (article_url) {
      query = query.eq('article_url', article_url).order('path', { ascending: true });
    }
    if (user_id) {
      query = query.eq('user_id', user_id).order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching comments:', error);
      return res.status(500).json({ error: error.message });
    }

    // Nếu là query theo user_id, map lại để có article_title
    let comments = data || [];
    if (user_id) {
      comments = comments.map(c => ({
        ...c,
        article_title: c.articles?.title || '',
      }));
    }

    return res.json({ comments });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/comments
router.post('/', async (req, res) => {
  const { access_token, article_url, content, parent_id } = req.body;
  
  console.log('Received comment request:', {
    access_token: access_token ? 'present' : 'missing',
    article_url,
    content: content ? 'present' : 'missing',
    parent_id,
    body: req.body
  });
  
  if (!access_token || !article_url || !content) {
    return res.status(400).json({ error: 'Missing access_token, article_url, or content' });
  }

  try {
    // Xác thực user từ access_token
    const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid access_token' });
    }

    let commentData = {
      article_url,
      user_id: user.id,
      content: content.trim(),
    };

    let parentComment = null;
    let newDepth = 0;
    let rootId = null;
    // Nếu có parent_id, đây là reply
    if (parent_id) {
      console.log('Processing reply with parent_id:', parent_id);
      // Kiểm tra parent comment có tồn tại không
      const { data: parent, error: parentError } = await supabase
        .from('comments')
        .select('id, depth, root_id, path')
        .eq('id', parent_id)
        .eq('article_url', article_url)
        .eq('is_deleted', false)
        .single();
      if (parentError || !parent) {
        console.error('Parent comment not found:', { parent_id, article_url, error: parentError });
        return res.status(400).json({ error: 'Parent comment not found' });
      }
      parentComment = parent;
      // Kiểm tra độ sâu tối đa
      if (parentComment.depth >= 2) {
        return res.status(400).json({ error: 'Maximum reply depth reached' });
      }
      newDepth = parentComment.depth + 1;
      rootId = parentComment.root_id || parentComment.id;
      commentData = {
        ...commentData,
        parent_id: parseInt(parent_id),
        root_id: rootId,
        depth: newDepth,
        path: null, // update sau khi comment được tạo, cần uuid để tạo path
      };
    } else {
      console.log('Processing top-level comment');
      // Comment gốc
      commentData = {
        ...commentData,
        root_id: null,
        depth: 0,
        path: null, // sẽ update sau
      };
    }

    // 1. Thêm comment (path=null)
    const { data: inserted, error: insertError } = await supabase
      .from('comments')
      .insert([commentData])
      .select('id')
      .single();
    if (insertError) {
      console.error('Error creating comment:', insertError);
      return res.status(500).json({ error: insertError.message });
    }
    const newCommentId = inserted.id;

    // 2. Tính path
    let newPath;
    if (parentComment) {
      newPath = parentComment.path ? `${parentComment.path}/${newCommentId}` : `${newCommentId}`;
    } else {
      newPath = newCommentId.toString();
    }

    // 3. Update lại path cho comment vừa insert
    const { data: updated, error: updateError } = await supabase
      .from('comments')
      .update({ path: newPath })
      .eq('id', newCommentId)
      .select(`
        id, 
        content, 
        created_at,
        parent_id,
        root_id,
        depth,
        path,
        user_info (
          full_name, 
          avatar_url
        )
      `)
      .single();
    if (updateError) {
      console.error('Error updating comment path:', updateError);
      return res.status(500).json({ error: updateError.message });
    }
    console.log('Comment created and path updated successfully:', updated);
    return res.json({ comment: updated });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/comments/replies?comment_id=...
router.get('/replies', async (req, res) => {
  const { comment_id } = req.query;
  if (!comment_id) return res.status(400).json({ error: 'Missing comment_id' });
  
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id, 
        content, 
        created_at,
        parent_id,
        root_id,
        depth,
        path,
        user_info (
          full_name, 
          avatar_url
        )
      `)
      .eq('parent_id', comment_id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching replies:', error);
      return res.status(500).json({ error: error.message });
    }
    
    return res.json({ replies: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 