const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabase');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });


// Đăng ký
router.post('/register', upload.single('avatar'), async (req, res) => {
    const { email, password, full_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  
    // 1. Đăng ký với Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });
  
    const user = data.user;
    if (!user) return res.status(500).json({ error: 'User not created' });
  
    // 2. Upload avatar nếu có file
    let avatar_url = null;
    if (req.file) {
      console.log("image detected");
        const ext = req.file.originalname.split('.').pop();
        const filePath = `avatars/${user.id}_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
            .from('news-reading')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true,
            });
        if (uploadError) {
            console.error('Upload avatar error:', uploadError);
            // Không trả lỗi, chỉ bỏ qua avatar
        } else {
            // Lấy public URL
            const { data: publicUrlData } = supabase.storage
                .from('news-reading')
                .getPublicUrl(filePath);
            avatar_url = publicUrlData?.publicUrl || null;
        }
    }
  
    // 3. Thêm vào bảng user_info
    const { error: infoError } = await supabase
      .from('user_info')
      .insert([
        {
          id: user.id,
          full_name: full_name || null,
          avatar_url: avatar_url || null,
        }
      ]);

    if (infoError) {
        console.error('Insert user_info error: ', infoError);
        return res.status(500).json({ error: infoError.message });
    }
  
    // 4. Lấy lại thông tin user_info
    const { data: info } = await supabase
      .from('user_info')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();

    return res.json({ user: { ...user, ...info } });
  });

// Đăng nhập
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  // Lấy thêm thông tin user_info
  let info = {};
  if (data.user && data.user.id) {
    const { data: infoData } = await supabase
      .from('user_info')
      .select('full_name, avatar_url')
      .eq('id', data.user.id)
      .single();
    if (infoData) info = infoData;
  }

  return res.json({ user: { ...data.user, ...info }, access_token: data.session?.access_token });
});

// Cập nhật thông tin tài khoản
router.post('/update-profile', upload.single('avatar'), async (req, res) => {
  const { full_name } = req.body;
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token và lấy user info
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    let avatar_url = null;
    
    // Upload avatar mới nếu có
    if (req.file) {
      const ext = req.file.originalname.split('.').pop();
      const filePath = `avatars/${user.id}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('news-reading')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });
      if (uploadError) {
        console.error('Upload avatar error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload avatar' });
      } else {
        // Lấy public URL
        const { data: publicUrlData } = supabase.storage
          .from('news-reading')
          .getPublicUrl(filePath);
        avatar_url = publicUrlData?.publicUrl || null;
      }
    }
    
    // Update user_info
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (avatar_url) updateData.avatar_url = avatar_url;
    
    const { error: updateError } = await supabase
      .from('user_info')
      .update(updateData)
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Update user_info error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }
    
    // Lấy lại thông tin user_info đã update
    const { data: info } = await supabase
      .from('user_info')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();
    
    return res.json({ 
      user: { 
        ...user, 
        full_name: info?.full_name || user.full_name,
        avatar_url: info?.avatar_url || user.avatar_url
      } 
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 