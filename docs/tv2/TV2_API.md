# API phần Danh mục / Khóa học / Bài học (TV2)

Ghi chú lại các API mình làm, cách chạy thử và kết quả test. Phần giải thích code đi qua các tầng thì xem file [TV2_DATA_FLOW.md](TV2_DATA_FLOW.md).

## Cách chạy

Cần cài Docker Desktop, JDK 17 trở lên, Node 18 trở lên.

```powershell
# trong thư mục online-course
docker compose up -d          # MySQL cổng 3306 (root / course123), Adminer ở http://localhost:8082

cd backend
.\mvnw.cmd spring-boot:run    # backend chạy ở http://localhost:8080

cd ..\frontend
npm install
npm run dev                   # frontend ở http://localhost:5173
```

Không cần tạo bảng bằng tay, chạy backend lên là Hibernate tự tạo `categories`, `courses`, `lessons`.

Chạy test backend: `.\mvnw.cmd test` (trong thư mục backend).

## Tạo tài khoản admin

Project chưa có sẵn tài khoản admin nên phải tự tạo: đăng ký một tài khoản bình thường (trên trang /register hoặc gọi API), sau đó vào DB đổi role:

```powershell
docker exec online-course-mysql mysql -uroot -pcourse123 online_course_db -e "UPDATE users SET role='ADMIN' WHERE email='admin@test.local';"
```

Đổi xong thì đăng nhập lại để lấy token mới. Các API thêm/sửa/xóa đều phải gửi kèm header `Authorization: Bearer <token>`.

## Danh sách API

Public là ai cũng gọi được. Admin là phải đăng nhập bằng tài khoản ADMIN, user thường gọi sẽ bị 403, chưa đăng nhập thì 401.

**Danh mục**

| Method | URL | Quyền | Ghi chú |
|---|---|---|---|
| GET | /api/categories | Public | chỉ lấy danh mục đang ACTIVE |
| GET | /api/categories/{id} | Public | danh mục bị ẩn thì 404 |
| POST | /api/categories | Admin | trả 201 |
| PUT | /api/categories/{id} | Admin | |
| DELETE | /api/categories/{id} | Admin | không xóa thật, chỉ chuyển INACTIVE, trả 204 |
| GET | /api/admin/categories | Admin | lấy hết, kể cả INACTIVE |

**Khóa học**

| Method | URL | Quyền | Ghi chú |
|---|---|---|---|
| GET | /api/courses | Public | tìm kiếm, lọc, phân trang (xem bên dưới), chỉ khóa học PUBLISHED |
| GET | /api/courses/{id} | Public | có kèm danh sách bài học; khóa học đang ẩn thì 404 |
| POST | /api/courses | Admin | mặc định là DRAFT |
| PUT | /api/courses/{id} | Admin | |
| DELETE | /api/courses/{id} | Admin | chuyển INACTIVE |
| GET | /api/admin/courses | Admin | lấy hết, lọc thêm được theo `status` |
| GET | /api/admin/courses/{id} | Admin | dùng cho form sửa |

**Bài học**

| Method | URL | Quyền | Ghi chú |
|---|---|---|---|
| GET | /api/courses/{courseId}/lessons | Public | không trả `videoUrl` |
| POST | /api/courses/{courseId}/lessons | Admin | |
| PUT | /api/lessons/{id} | Admin | |
| DELETE | /api/lessons/{id} | Admin | chuyển INACTIVE |
| GET | /api/admin/courses/{courseId}/lessons | Admin | có `videoUrl` |

Link video không trả ở API public, học viên đăng ký rồi sẽ lấy qua API học tập của TV3.

## Tìm kiếm và phân trang

Ví dụ: `GET /api/courses?keyword=java&categoryId=1&page=0&size=12&sort=price,asc`

- `keyword`: tìm theo tên và mô tả, không phân biệt hoa thường
- `categoryId`: lọc theo danh mục
- `page`: bắt đầu từ 0, mặc định 0
- `size`: mặc định 12, lớn nhất 50 (truyền lớn hơn thì vẫn chỉ lấy 50)
- `sort`: mặc định `createdAt,desc`, chỉ sort được theo `createdAt`, `price`, `title`
- `status` (chỉ có ở /api/admin/courses): `DRAFT`, `PUBLISHED`, `INACTIVE`

Kết quả trả về:

```json
{
  "content": [
    {
      "id": 1,
      "categoryId": 1,
      "categoryName": "Lập trình",
      "title": "Java Spring Boot cơ bản",
      "thumbnail": "https://example.com/java.png",
      "price": 499000.00,
      "originalPrice": 799000.00,
      "instructorName": "Nguyễn Văn A",
      "level": "BEGINNER",
      "duration": 600,
      "status": "PUBLISHED",
      "lessonCount": 12,
      "averageRating": null,
      "reviewCount": null,
      "createdAt": "2026-10-21T10:00:00",
      "updatedAt": "2026-10-21T10:30:00"
    }
  ],
  "page": 0,
  "size": 12,
  "totalElements": 1,
  "totalPages": 1
}
```

`lessonCount` chỉ đếm bài học đang ACTIVE. `averageRating` và `reviewCount` tạm thời là null, đợi phần đánh giá của TV3.

## Dữ liệu gửi lên

**Danh mục**

```json
{ "name": "Lập trình", "description": "Các khóa lập trình", "image": "https://example.com/c.png", "status": "ACTIVE" }
```

- `name` bắt buộc, tối đa 150 ký tự, không được trùng tên danh mục khác
- `image` phải là link http/https (hoặc để trống)
- `status` không gửi thì: tạo mới là ACTIVE, sửa thì giữ nguyên

**Khóa học**

```json
{
  "categoryId": 1,
  "title": "Java Spring Boot cơ bản",
  "description": "Xây dựng REST API với Spring Boot",
  "thumbnail": "https://example.com/java.png",
  "price": 499000,
  "originalPrice": 799000,
  "instructorName": "Nguyễn Văn A",
  "level": "BEGINNER",
  "duration": 600,
  "status": "DRAFT"
}
```

- Bắt buộc: `categoryId`, `title`, `price`, `level`
- `price` >= 0. `originalPrice` (giá gốc) có thể bỏ trống, nếu có thì phải >= `price`
- `level`: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`
- `duration` tính bằng phút
- `thumbnail` phải là link http/https
- `status` không gửi thì tạo mới là DRAFT, sửa thì giữ nguyên

Học viên chỉ thấy khóa học khi nó đang PUBLISHED và danh mục của nó còn ACTIVE.

**Bài học**

```json
{ "title": "Giới thiệu", "description": "Tổng quan khóa học", "videoUrl": "https://youtu.be/xyz", "duration": 10, "lessonOrder": 1, "status": "ACTIVE" }
```

- Bắt buộc: `title`, `lessonOrder`
- `lessonOrder` >= 1 và không được trùng với bài khác trong cùng khóa học
- `videoUrl` phải là link http/https

## Về việc xóa

Theo task thì không xóa hẳn dữ liệu, vì bảng đăng ký và đánh giá của TV3 có tham chiếu tới khóa học. Gọi DELETE chỉ đổi trạng thái sang INACTIVE:

- Ẩn danh mục thì các khóa học trong danh mục đó cũng không hiện ngoài trang chủ nữa
- Ẩn khóa học thì học viên vào sẽ thấy 404, nhưng admin vẫn xem và sửa được
- Ẩn bài học thì nó không hiện trong danh sách bài học và không được tính vào `lessonCount`

Muốn hiện lại thì gọi PUT, đổi `status` về ACTIVE hoặc PUBLISHED.

## Lỗi trả về

Dùng chung format lỗi của TV1:

```json
{
  "status": 400,
  "message": "Validation error",
  "errors": { "originalPrice": "Original price must not be lower than price" },
  "timestamp": "2026-10-21T10:00:00"
}
```

- 400: dữ liệu sai (xem `errors`), trùng tên danh mục, trùng thứ tự bài học, tham số sort/page/size không hợp lệ
- 401: chưa đăng nhập hoặc token hết hạn
- 403: không phải admin
- 404: không tìm thấy, hoặc đang bị ẩn

## Test bằng Postman

1. Import file `TV2_Course_API.postman_collection.json` (cùng thư mục này).
2. Vào tab Variables của collection, điền email/mật khẩu của tài khoản admin và một tài khoản user thường.
3. Bấm Run collection. Request đầu tiên sẽ tự đăng nhập lấy token, các id tạo ra cũng tự lưu lại cho các request sau.

Hoặc chạy bằng lệnh:

```powershell
npx -y newman run docs/tv2/TV2_Course_API.postman_collection.json --env-var adminEmail=admin@test.local --env-var adminPassword=Password123! --env-var userEmail=user@test.local --env-var userPassword=Password123!
```

## Kết quả test (22/10)

- `mvnw test`: 92/92 test pass
- Chạy thử trên MySQL thật bằng script: 33/33 trường hợp đúng
- Postman: 43 request, 71 assertion, không lỗi
- Frontend: `npm run lint` và `npm run build` không lỗi
