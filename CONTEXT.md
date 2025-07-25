# Tổng Quan Dự Án NewsReading

## 1. Tech Stack

- **Frontend**: React Native + Expo
- **Backend**: Node.js/Express (crawling dữ liệu)
- **Database**: Supabase (PostgreSQL)
- **Thư viện chính**: 
  - axios, moment, cheerio, react-native-rss-parser, @supabase/supabase-js
  - expo-router, react-native-gesture-handler, react-native-render-html, htmlparser2, jsdom

## 2. Luồng Logic Chính

1. **Crawl RSS**: Server định kỳ lấy dữ liệu từ RSS các báo, lưu vào database.
2. **Lấy danh sách bài viết**: Client gọi API lấy danh sách bài viết theo danh mục, phân trang.
3. **Xem chi tiết bài viết**: Client sẽ crawl nội dung từ trang gốc. Điều này có thể được thực hiện vì app mobile không bị block CORS.
4. **Đăng nhập/Đăng ký**: Người dùng xác thực qua API, lưu trạng thái đăng nhập.
5. **Bình luận, bookmark, chia sẻ**: Thực hiện qua các API tương ứng.
6. **Tối ưu hiệu năng**: Lazy loading, caching (server & client), image optimization, pagination, debounce search.

## 3. Chức Năng Chính

- Đọc tin tức theo danh mục
- Đăng nhập/Đăng ký tài khoản
- Xem chi tiết bài viết
- Bình luận dưới bài viết
- Bookmark bài viết yêu thích
- Chia sẻ bài viết
- Tìm kiếm bài viết theo từ khoá
- Quản lý tài khoản cá nhân

## 4. Cấu Trúc Thư Mục

```
NewsReading/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── account.tsx
│   │   ├── index.tsx
│   │   └── saved.tsx
│   └── article/
│       ├── _layout.tsx
│       └── [id].tsx
├── components/
│   ├── ui/
│   │   ├── ArticleList.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorDisplay.tsx
│   │   ├── Header.tsx
│   │   ├── Input.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── SearchBar.tsx
│   │   ├── SearchResultsHeader.tsx
│   │   ├── index.ts
│   │   └── README.md
│   ├── ArticleCard.tsx
│   ├── CategoryTabs.tsx
│   ├── UserStatus.tsx
│   └── CommentSection.tsx
├── contexts/
│   └── AuthContext.tsx
├── services/
│   └── api.ts
├── utils/
│   └── timeFormat.ts
├── types/
│   └── env.d.ts
├── package.json
└── tsconfig.json
```

## 5. Các Task Cần Làm (TODO)

- [ ] **Backend**: 
  - Hoàn thiện API crawl metadata bài viết
  - Bổ sung xác thực, bảo vệ các API cần quyền truy cập
  - Tối ưu caching phía server
- [ ] **Frontend**:
  - Hoàn thiện UI/UX cho các màn hình: chi tiết bài viết, bình luận, bookmark, profile
  - Thêm loading/error state cho tất cả các màn hình
  - Tối ưu cache phía client (bài viết đã xem, danh mục đã tải)
- [ ] **Tính năng nâng cao**:
  - Thông báo khi có bài viết mới
  - Quản lý bình luận dạng cây (hiện đã có cấu trúc DB, cần UI)
  - Tối ưu performance cho infinite scroll, pull-to-refresh
- [ ] **Testing**:
  - Viết test cho các component UI
  - Test API integration
- [ ] **Tài liệu**:
  - Bổ sung hướng dẫn cài đặt, phát triển, deploy trong README.md 
