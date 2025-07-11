const { supabase } = require('./services/supabase');

async function setupNewsSources() {
  try {
    console.log('Setting up news_sources table...');
    
    // Define the news sources
    const sources = [
      {
        id: 1,
        name: 'Tuổi Trẻ',
        icon_url: 'https://statictuoitre.mediacdn.vn/web_images/favicon.ico',
        domain: 'tuoitre.vn'
      },
      {
        id: 2,
        name: 'Thanh Niên',
        icon_url: 'https://thanhnien.vn/favicon.ico',
        domain: 'thanhnien.vn'
      },
      {
        id: 3,
        name: 'Dân Trí',
        icon_url: 'https://dantri.com.vn/favicon.ico',
        domain: 'dantri.com.vn'
      },
      {
        id: 4,
        name: 'Pháp Luật',
        icon_url: 'https://static-cms-plo.epicdn.me/v4/web/styles/img/favicon.png',
        domain: 'plo.vn'
      },
      {
        id: 5,
        name: 'VietNamNet',
        icon_url: 'https://vietnamnet.vn/favicon.ico',
        domain: 'vietnamnet.vn'
      },
      {
        id: 6,
        name: 'VnExpress',
        icon_url: 'https://vnexpress.net/favicon.ico',
        domain: 'vnexpress.net'
      }
    ];
    
    // Insert sources with timestamps
    const sourcesWithTimestamps = sources.map(source => ({
      ...source,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('news_sources')
      .upsert(sourcesWithTimestamps, { onConflict: 'id' });
    
    if (error) {
      console.error('Error setting up news_sources:', error);
    } else {
      console.log('Successfully set up news_sources table!');
    }
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

// tự động chạy nếu require 
if (require.main === module) {
  setupNewsSources();
}

module.exports = { setupNewsSources }; 