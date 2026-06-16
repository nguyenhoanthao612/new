export interface IC3Question {
  id: string;
  module: "cf" | "ka" | "lo"; // cf = Computing Fundamentals, ka = Key Applications, lo = Living Online
  topic: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface UserProgress {
  userId: string;
  role: "student" | "teacher" | "admin";
  displayName: string;
  email: string;
  classId?: string;
  createdAt: number;
}

export interface ExamRecord {
  id: string;
  userId: string;
  studentName: string;
  module: "cf" | "ka" | "lo";
  score: number; // Percentage or correct / total
  correctCount: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  passed: boolean;
  createdAt: number;
}

export interface Classroom {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  teacherName: string;
  studentIds: string[];
  createdAt: number;
}

export interface UploadedDocument {
  id: string;
  userId: string;
  userEmail: string;
  name: string;
  size: number;
  type: string;
  createdAt: number;
}

export const IC3_MODULES = [
  {
    id: "cf",
    name: "Máy tính Căn bản (Computing Fundamentals)",
    description: "Kiến thức về phần cứng, phần mềm, hệ điều hành và xử lý sự cố cơ bản.",
    passingScore: 700, // standard scale
    timeLimit: 50, // minutes
  },
  {
    id: "ka",
    name: "Các ứng dụng Chủ chốt (Key Applications)",
    description: "Sử dụng thành thạo các ứng dụng văn phòng: xử lý văn bản, bảng tính, trình chiếu.",
    passingScore: 700,
    timeLimit: 50,
  },
  {
    id: "lo",
    name: "Cuộc sống Trực tuyến (Living Online)",
    description: "Kỹ năng mạng internet, truyền thông xã hội, email, an toàn thông tin mạng và tìm kiếm thông tin.",
    passingScore: 700,
    timeLimit: 50,
  },
] as const;

export const SAMPLE_QUESTIONS: IC3Question[] = [
  // Computing Fundamentals
  {
    id: "cf_01",
    module: "cf",
    topic: "Phần cứng (Hardware)",
    questionText: "Bộ phận nào sau đây của máy tính chịu trách nhiệm thực hiện các phép tính logic và xử lý dữ liệu chính?",
    options: [
      "RAM (Memory)",
      "Ổ cứng HDD",
      "CPU (Central Processing Unit)",
      "Bộ nguồn (Power Supply)"
    ],
    correctIndex: 2,
    explanation: "CPU (Bộ xử lý trung tâm) là bộ não của máy tính, thực hiện các chỉ thị của phần mềm và xử lý phần lớn dữ liệu đầu vào/đầu ra."
  },
  {
    id: "cf_02",
    module: "cf",
    topic: "Phần mềm & Hệ điều hành",
    questionText: "Tải (RAM) của máy tính dùng để làm gì?",
    options: [
      "Lưu trữ dữ liệu vĩnh viễn khi máy tắt nguồn",
      "Lưu trữ tạm thời dữ liệu và ứng dụng đang hoạt động",
      "Xử lý các tác vụ đồ họa 3D phức tạp",
      "Kết nối máy tính với mạng nội bộ gia đình"
    ],
    correctIndex: 1,
    explanation: "RAM (Random Access Memory) là bộ nhớ tạm thời của máy tính, mất toàn bộ dữ liệu lưu trữ khi máy tính bị mất điện hoặc tắt."
  },
  {
    id: "cf_03",
    module: "cf",
    topic: "Xử lý sự cố",
    questionText: "Khi bàn phím máy tính để bàn bỗng dưng không phản hồi, bước kiểm tra đầu tiên và trực quan nhất là gì?",
    options: [
      "Cài đặt lại toàn bộ hệ điều hành Windows",
      "Kiểm tra xem dây cáp nối USB của bàn phím có bị lỏng hay rút ra không",
      "Mua ngay một bàn phím mới để thay thế",
      "Thay thế bo mạch chủ (Mainboard)"
    ],
    correctIndex: 1,
    explanation: "Bí quyết xử lý sự cố phần cứng luôn bắt đầu bằng kiểm tra các yếu tố vật lý cơ bản như cổng kết nối và dây cáp."
  },
  {
    id: "cf_04",
    module: "cf",
    topic: "Hệ điều hành",
    questionText: "Đâu là hệ điều hành nguồn mở phổ biến rộng rãi nhất hiện nay?",
    options: [
      "Microsoft Windows",
      "Apple macOS",
      "Linux",
      "ChromeOS"
    ],
    correctIndex: 2,
    explanation: "Linux là hệ điều hành nguồn mở nổi tiếng nhất, cho phép cộng đồng lập trình viên thế giới tự do truy xuất và sửa đổi mã nguồn."
  },

  // Key Applications
  {
    id: "ka_01",
    module: "ka",
    topic: "Xử lý văn bản (Word Processing)",
    questionText: "Trong Microsoft Word, tổ hợp phím tắt nào được sử dụng để căn giữa nội dung đoạn văn bản được chọn?",
    options: [
      "Ctrl + L",
      "Ctrl + R",
      "Ctrl + J",
      "Ctrl + E"
    ],
    correctIndex: 3,
    explanation: "Ctrl + E dùng để căn giữa văn bản (Center), trong khi Ctrl + L là căn trái, Ctrl + R là căn phải và Ctrl + J là căn đều."
  },
  {
    id: "ka_02",
    module: "ka",
    topic: "Bảng tính (Spreadsheets)",
    questionText: "Trong bảng tính Microsoft Excel, công thức nào sau đây dùng để tính trung bình cộng số liệu của các ô từ A1 đến A5?",
    options: [
      "=SUM(A1:A5)",
      "=AVERAGE(A1:A5)",
      "=MIN(A1:A5)",
      "=COUNT(A1:A5)"
    ],
    correctIndex: 1,
    explanation: "Hàm =AVERAGE(A1:A5) tính trung bình cộng của dãy ô được chỉ định. SUM là tính tổng, MIN tìm giá trị nhỏ nhất, COUNT đếm các ô chứa số."
  },
  {
    id: "ka_03",
    module: "ka",
    topic: "Trình chiếu (Presentations)",
    questionText: "Khi đang trình chiếu PowerPoint, phím nào trên bàn phím dùng để kết thúc chế độ trình chiếu và quay lại màn hình soạn thảo?",
    options: [
      "Esc",
      "Spacebar",
      "Enter",
      "F5"
    ],
    correctIndex: 0,
    explanation: "Phím Escape (Esc) dùng để thoát khỏi chế độ trình chiếu slide. Phím F5 bắt đầu cuộc trình chiếu từ slide đầu tiên."
  },
  {
    id: "ka_04",
    module: "ka",
    topic: "Bảng tính (Spreadsheets)",
    questionText: "Ký tự nào luôn được bắt đầu khi nhập một công thức toán học hoặc hàm trong Excel?",
    options: [
      "Ký tự $ (Dollar)",
      "Ký tự @ (At)",
      "Ký tự = (Bằng)",
      "Ký tự ! (Chấm than)"
    ],
    correctIndex: 2,
    explanation: "Toàn bộ công thức và hàm của Excel phải bắt đầu bằng dấu '='. Nếu không có dấu =, Excel sẽ hiểu đó là một đoạn văn bản thuần túy."
  },

  // Living Online
  {
    id: "lo_01",
    module: "lo",
    topic: "Mạng máy tính",
    questionText: "Mạng máy tính kết nối các máy tính trong phạm vi hẹp như một văn phòng, tòa nhà hay gia đình được gọi là gì?",
    options: [
      "WAN (Wide Area Network)",
      "LAN (Local Area Network)",
      "Mạng Đám mây (Cloud)",
      "Internet"
    ],
    correctIndex: 1,
    explanation: "LAN (Mạng cục bộ) kết nối các thiết bị trong phạm vi địa lý nhỏ như một phòng, văn phòng, trường học hoặc ngôi nhà của bạn."
  },
  {
    id: "lo_02",
    module: "lo",
    topic: "An toàn thông tin",
    questionText: "Thế nào là một mật khẩu mạnh và an toàn để bảo mật tài khoản cá nhân?",
    options: [
      "Là ngày tháng năm sinh hoặc số điện thoại của chính bạn",
      "Mật khẩu chứa chữ hoa, chữ thường, số và biểu tượng đặc biệt, độ dài tối thiểu 8 ký tự và khó đoán",
      "Chuỗi ký tự liên hoàn như '12345678' hoặc 'qwerty'",
      "Là tên của dịch vụ bạn đăng ký, ví dụ: 'facebook123'"
    ],
    correctIndex: 1,
    explanation: "Một mật khẩu mạnh phải hội tụ đủ độ dài, tính ngẫu nhiên, không chứa thông tin cá nhân dễ suy đoán và kết hợp phong phú các nhóm ký tự."
  },
  {
    id: "lo_03",
    module: "lo",
    topic: "Thư điện tử (Email)",
    questionText: "Trong Email, tính năng Bcc (Blind Carbon Copy) khác với Cc (Carbon Copy) như thế nào?",
    options: [
      "Bcc gửi thư nhanh hơn Cc",
      "Bcc cho phép người nhận biết được danh sách những ai cũng nhận được thư này",
      "Bcc ẩn địa chỉ email của người nhận đối với những người nhận thư khác",
      "Bcc tự động mã hóa nội dung thư để chống hack"
    ],
    correctIndex: 2,
    explanation: "Bcc ẩn danh sách email của những người cùng nhận, giúp tạo sự riêng tư bảo mật. Còn Cc sẽ hiển thị toàn bộ người nhận cho nhau xem."
  },
  {
    id: "lo_04",
    module: "lo",
    topic: "Mạng xã hội & Truyền thông",
    questionText: "Thuật ngữ 'Phishing' trên môi trường Internet ám chỉ hành vi gian lận nào?",
    options: [
      "Tải lậu các game máy tính có bản quyền miễn phí",
      "Tấn công từ chối dịch vụ (DDoS) làm treo trang web của trường học",
      "Hành vi lừa đảo giả dạng các tổ chức đáng tin cậy để đánh cắp tên đăng nhập, mật khẩu, thông tin thẻ tín dụng của nạn nhân",
      "Việc tạo ra các tài khoản mạng xã hội giả định để kết bạn"
    ],
    correctIndex: 2,
    explanation: "Phishing (tấn công giả mạo) là hình thức lừa đảo qua mạng phổ biến bằng cách gửi các email, link web giống hệt trang thật (ví dụ Gmail, ngân hàng) nhằm lừa chiếm đoạt thông tin đăng nhập của nạn nhân."
  }
];
