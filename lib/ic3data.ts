export interface Lesson {
  id: string;
  moduleId: "CF" | "KA" | "LO";
  topic: string;
  title: string;
  content: string; // Markdown supported
  imageUrl?: string;
  videoUrl?: string; // or simulated video description
  resources?: { name: string; url: string }[];
}

export interface Question {
  id: string;
  moduleId: "CF" | "KA" | "LO";
  topic: string;
  type: "single-choice" | "multiple-response" | "true-false" | "matching" | "drag-drop" | "hotspot" | "performance" | "video";
  difficulty: "easy" | "medium" | "hard";
  skills: string[];
  tags: string[];
  questionText: string;
  explanation: string;
  referenceUrl?: string;
  
  // Specific properties per question type
  options?: string[]; // Code for choices: single-choice, multiple-response
  correctSingle?: string; // Single choice or true-false correct choice
  correctMultiple?: string[]; // Multiple response correct answers
  
  // Matching specifics
  matchingPairs?: { left: string; right: string }[]; // Left values match Right values
  
  // Drag-drop specifics
  dragItems?: string[];
  dragTargets?: { placeholder: string; expectedItem: string }[]; // index-aligned or label based
  
  // Hotspot specifics
  hotspotImage?: string; // base64 or URL
  hotspotInteractiveDesc?: string;
  hotspots?: { id: string; name: string; x: number; y: number; width: number; height: number; isCorrect: boolean }[];
  
  // Performance based specifics
  performanceTask?: {
    instruction: string;
    targetEnvironment: "os" | "word" | "excel" | "powerpoint";
    initialState: any;
    expectedState: any; // Checked during submission
  };
  
  // Video based specifics
  videoSource?: string; // Simulated video scene
  videoTimeline?: { time: number; prompt: string }[];
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  moduleId: "CF" | "KA" | "LO" | "ALL";
  durationMinutes: number;
  passingScorePercent: number;
  questions: Question[];
}

export interface UserLog {
  id: string;
  email: string;
  role: "student" | "teacher" | "admin";
  progressPercent: number;
  completedLessons: string[]; // lessonIds
  examHistory: {
    examId: string;
    title: string;
    score: number;
    correctCount: number;
    totalCount: number;
    timeSpentSeconds: number;
    date: string;
    passed: boolean;
    skillPerformance: { [skill: string]: number }; // percentage correctly answered
  }[];
}

// SEED DATA
export const INITIAL_LESSONS: Lesson[] = [
  // Computing Fundamentals
  {
    id: "cf-1",
    moduleId: "CF",
    topic: "Phần cứng",
    title: "Hiểu về RAM, CPU và Thiết bị lưu trữ",
    content: `### 1. CPU (Central Processing Unit) - Bộ vi xử lý trung tâm
CPU được coi là "bộ não" của máy tính. Nó đảm nhận vai trò thực thi dữ liệu và điều khiển tất cả các thiết bị khác hoạt động theo lệnh dạng số nhị phân. Các chỉ số quan trọng của CPU bao gồm:
* **Tốc độ xung nhịp (Clock Speed)**: Đo bằng Gigahertz (GHz), quyết định tốc độ xử lý của chip.
* **Số nhân/số luồng**: Giúp thực hiện đa tác vụ đồng thời hiệu quả hơn.

### 2. RAM (Random Access Memory) - Bộ nhớ truy cập ngẫu nhiên
RAM là bộ nhớ tạm thời của máy tính. Dữ liệu trên RAM sẽ **mất hoàn toàn** khi máy tính tắt nguồn (Volatile Memory). RAM đóng vai trò lưu các tiến trình đang chạy của hệ điều hành và ứng dụng để CPU truy xuất cực nhanh.
* Dung lượng RAM càng lớn, máy tính càng có hai khả năng đa nhiệm (mở nhiều tab Google Chrome, ứng dụng văn phòng cùng lúc) mượt mà hơn.

### 3. Thiết bị lưu trữ (HDD so với SSD)
* **HDD (Hard Disk Drive)**: Sử dụng các đĩa từ quay cơ học để ghi đọc dữ liệu. Giá rẻ, dung lượng rất lớn nhưng tốc độ ghi đọc chậm (khoảng 80-150MB/s) và dễ hỏng nếu bị va đập khi đang quay.
* **SSD (Solid State Drive)**: Sử dụng chip nhớ flash bán dẫn bền bỉ. Tốc độ ghi đọc cực nhanh (từ 500MB/s đến hơn 5000MB/s đối với chuẩn NVMe), không gây ra tiếng ồn, tiết kiệm điện hơn và chống sốc vật lý tuyệt đối.

### 4. Thiết bị Ngoại vi (Input/Output)
* **Thiết bị Đầu vào (Input)**: Bàn phím, chuột, máy quét (Scanner), Micro, Camera.
* **Thiết bị Đầu ra (Output)**: Màn hình, Máy in, Loa, Tai nghe.`,
    imageUrl: "https://picsum.photos/seed/hardware/800/400"
  },
  {
    id: "cf-2",
    moduleId: "CF",
    topic: "Hệ điều hành",
    title: "Cơ chế quản lý tập tin và Hệ điều hành (OS) thông dụng",
    content: `### 1. Hệ điều hành là gì?
Hệ điều hành (OS) là phần mềm hệ thống quản lý toàn bộ tài nguyên phần cứng, cung cấp giao diện người dùng (GUI hoặc CLI) và môi trường runtime cho các phần mềm ứng dụng khác hoạt động. Các OS thông dụng hiện nay gồm:
* **Microsoft Windows**: Hệ điều hành phổ biến nhất thế giới trên PC thương mại, hỗ trợ kho phần mềm khổng lồ.
* **macOS**: Hệ điều hành độc quyền của Apple tối ưu tốt cho đồ họa, bảo mật mạnh mẽ.
* **Linux**: Hệ điều hành mã nguồn mở, bảo mật cao, miễn phí, thường dùng cho các máy chủ lưu trữ (Servers).
* **Android / iOS**: Hệ điều hành cho thiết bị di động thông dụng.

### 2. Quản lý Tập tin & Cấu trúc Thư mục
Trong Windows, dữ liệu được sắp xếp theo cấu trúc hình cây phân cấp từ Thư mục gốc (Root directory như ổ \`C:\\\` hay \`D:\\\`) đi tới các Thư mục con và Tập tin cụ thể.
* **Định nghĩa đường dẫn (Path)**: Thể hiện vị trí chính xác của file, ví dụ \`C:\\IC3_LuyenThi\\Documents\\BaoCao.docx\`.
* **Phần mở rộng tập tin (File Extension)**: Cho hệ điều hành biết chương trình nào sẽ mở tập tin đó mặc định. Ví dụ:
  * \`.docx\`: Microsoft Word
  * \`.xlsx\`: Microsoft Excel
  * \`.pptx\`: Microsoft PowerPoint
  * \`.pdf\`: Portable Document Format
  * \`.zip / .rar\`: Tập tin nén dữ liệu`,
    imageUrl: "https://picsum.photos/seed/os/800/400"
  },
  {
    id: "cf-3",
    moduleId: "CF",
    topic: "Bảo mật",
    title: "An toàn dữ liệu và Bảo mật máy tính cá nhân",
    content: `### 1. Tầm quan trọng của Sao lưu (Backup)
Sao lưu dữ liệu là việc sao chép các tệp tin quan trọng sang một thiết bị lưu trữ khác hoặc lên đám mây (Cloud) như Google Drive, OneDrive để đề phòng mất mát do hỏng phần cứng, nhiễm mã độc virus hoặc trộm cắp.
* **Nguyên tắc 3-2-1**: Có 3 bản sao dữ liệu, lưu giữ trên 2 loại phương tiện vật lý khác nhau, và 1 bản lưu bên ngoài văn phòng hoặc đám mây.

### 2. Các mối đe dọa từ Mã độc (Malware)
* **Virus**: Đoạn mã tự bám vào file khác để lây lan khắp máy tính khi file đó chạy.
* **Trojan**: Phần mềm giả dạng một công cụ hữu ích vô hại nhưng thực chất chứa mã độc mở đường cho hacker kiểm soát máy.
* **Ransomware**: Mã độc tống tiền khóa mã hóa dữ liệu của nạn nhân và đòi trả Bitcoin để giải mã.
* **Phishing**: Tấn công giả danh trang web ngân hàng, dịch vụ uy tín để lừa người dùng nhập tài khoản, mật khẩu.

### 3. Biện pháp bảo vệ hiệu quả
* Sử dụng mật khẩu mạnh dài tối thiểu 8 ký tự, bao gồm cả chữ hoa, chữ thường, số và ký tự đặc biệt (\`@, #, $, ...\`).
* Kích hoạt xác thực 2 lớp (2FA - Two-Factor Authentication).
* Luôn cập nhật phiên bản mới nhất của hệ điều hành và phần mềm virus phòng vệ.`,
    imageUrl: "https://picsum.photos/seed/security/800/400"
  },

  // Key Applications
  {
    id: "ka-1",
    moduleId: "KA",
    topic: "Word",
    title: "Soạn thảo văn bản chuyên nghiệp với Microsoft Word",
    content: `### 1. Giao diện và các thẻ chức năng (Ribbon Toolbar)
* **Home**: Chứa các tùy chọn định dạng cơ bản như Font chữ, cỡ chữ, căn lề (Trái, Phải, Giữa, Đều 2 bên), giãn dòng và các Style tiêu đề có sẵn.
* **Insert**: Sử dụng để chèn Bảng (Table), Vẽ sơ đồ (SmartArt), Chèn hình ảnh (Pictures), Chèn liên kết siêu văn bản (Hyperlink) và chèn Header/Footer hoặc Đánh số trang.
* **Layout**: Giúp đặt hướng giấy (Portrait - Dọc, Landscape - Ngang), căn biên (Margins) và phân chia cột văn bản.
* **References**: Sử dụng để tạo mục lục tự động, chèn chú thích cuối trang (Footnote).

### 2. Phím tắt Word kinh điển cần nhớ
* \`Ctrl + N\`: Tạo tài liệu mới trống.
* \`Ctrl + S\`: Lưu tài liệu đang mở.
* \`Ctrl + B\`: In đậm chữ (Bold).
* \`Ctrl + I\`: In nghiêng chữ (Italic).
* \`Ctrl + U\`: Gạch chân chữ (Underline).
* \`Ctrl + L\`, \`Ctrl + E\`, \`Ctrl + R\`, \`Ctrl + J\`: Căn lề Trái, Giữa, Phải, và Đều hai bên.`,
    imageUrl: "https://picsum.photos/seed/word/800/400"
  },
  {
    id: "ka-2",
    moduleId: "KA",
    topic: "Excel",
    title: "Làm chủ Bảng tính Excel và các Công thức tính toán Cơ bản",
    content: `### 1. Ô (Cell), Dòng (Row), Cột (Column) trong Excel
* **Ô (Cell)**: Giao điểm của cột và dòng, được đặt tên theo quy tắc \`Cột trước + Dòng sau\` (Ví dụ: ô ở cột \`B\`, dòng \`5\` có địa chỉ là \`B5\`).
* **Vùng dữ liệu (Range)**: Tập hợp nhiều ô kế tiếp nhau, phân tách bằng dấu hai chấm (Ví dụ: \`A1:C10\`).

### 2. Các hàm toán học và thống kê thiết yếu
* **SUM**: Tính tổng của một chuỗi số. Cú pháp: \`=SUM(A1:A5)\`.
* **AVERAGE**: Tính trung bình cộng của vùng dữ liệu. Cú pháp: \`=AVERAGE(B1:B10)\`.
* **COUNT**: Đếm số ô có chứa dữ liệu số. Cú pháp: \`=COUNT(C1:C15)\`.
* **MAX / MIN**: Tìm giá trị lớn nhất / nhỏ nhất trong vùng số.
* **IF**: Kiểm tra điều kiện logic để trả về kết quả tương ứng. Cú pháp: \`=IF(D2>=5, "Đậu", "Trượt")\`.

### 3. Địa chỉ tương đối và Địa chỉ tuyệt đối
* **Địa chỉ tương đối** (Ví dụ: \`A1\`): Tự động thay đổi vị trí hàng và cột khi chúng ta sao chép công thức sang ô khác.
* **Địa chỉ tuyệt đối** (Ví dụ: \`$A$1\`): Cố định hoàn toàn vị trí ô bằng ký hiệu \`$\`, không thay đổi bất kể ta kéo copy công thức đi đâu. Tạo lập nhanh bằng cách ấn phím \`F4\` khi đang gõ công thức.`,
    imageUrl: "https://picsum.photos/seed/excel/800/400"
  },
  {
    id: "ka-3",
    moduleId: "KA",
    topic: "PowerPoint",
    title: "Thiết kế slide trình bày chuyên nghiệp với Microsoft PowerPoint",
    content: `### 1. Cấu trúc bài thuyết trình thành công
Một bài thuyết trình hiệu quả cần tuân thủ quy tắc đơn giản hóa nội dung chữ. Tránh gõ toàn bộ khối văn bản lớn lên slide.
* Sử dụng quy tắc **6x6**: tối đa 6 dòng trên một slide, tối đa 6 từ trên một dòng.
* Tận dụng tối đa Hình ảnh, Biểu đồ và Sơ đồ để kích thích thị giác người nghe.

### 2. Hiệu ứng chuyển động (Animations) so với Hiệu ứng chuyển slide (Transitions)
* **Transitions (Chuyển slide)**: Hiệu ứng động diễn ra khi bạn chuyển tiếp giữa slide này sang slide tiếp theo (Ví dụ: Fade, Push, Wipe). Tìm thấy trong thẻ \`Transitions\`.
* **Animations (Chuyển động đối tượng)**: Hiệu ứng áp dụng riêng lẻ cho từng phần tử nhỏ bên trong 1 slide (như một khối text bay vào, một hình ảnh xoay tròn, một hình biến mất). Tìm thấy trong thẻ \`Animations\`.

### 3. Các chế độ xem slide (Views)
* **Normal View**: Chế độ làm việc biên tập thiết kế chính mặc định.
* **Slide Sorter View**: Hiển thị tất cả slide dưới dạng các thẻ nhỏ giúp dễ dàng bố trí lại thứ tự hay xóa slide hàng loạt.
* **Slide Show View (\`F5\` hoặc \`Shift + F5\`)**: Trình chiếu toàn màn hình để thuyết trình trực tiếp trước khán giả.`,
    imageUrl: "https://picsum.photos/seed/powerpoint/800/400"
  },

  // Living Online
  {
    id: "lo-1",
    moduleId: "LO",
    topic: "Internet",
    title: "Tổng quan về Mạng máy tính và các Dịch vụ Web",
    content: `### 1. Khái niệm cơ bản về IP và DNS
* **Địa chỉ IP (Internet Protocol)**: Dãy số duy nhất để định danh các thiết bị tham gia kết nối mạng (Ví dụ: \`192.168.1.1\` hoặc phiên bản mới IPv6 \`2001:db8::\`).
* **DNS (Domain Name System - Hệ thống phân giải tên miền)**: Đóng vai trò như " danh bạ điện thoại" của Internet, giúp chuyển đổi tên miền thân thiện (ví dụ \`google.com\`) sang địa chỉ IP máy chủ thô tương ứng để máy tính có thể kết nối.

### 2. Giao thức HTTP và HTTPS bảo mật
* **HTTP (Hypertext Transfer Protocol)**: Giao thức truyền dữ liệu web dạng thô, không mã hóa. Rất dễ bị tin tặc nghe trộm, đánh cắp mật khẩu giữa đường truyền.
* **HTTPS (Hypertext Transfer Protocol Secure)**: Phiên bản nâng cấp an toàn có tích hợp mã hóa SSL/TLS. Giúp dữ liệu từ trình duyệt của bạn đến máy chủ được bảo mật, biểu diễn bằng biểu tượng ổ khóa xanh trên thanh địa chỉ.

### 3. Tìm kiếm thông tin nâng cao trên Google
* Dùng dấu ngoặc kép \`"từ khóa"\`: Tìm kiếm khớp chính xác cụm từ.
* Dùng dấu trừ \`-khóa\`: Loại bỏ kết quả chứa từ khóa đó khỏi danh sách tìm kiếm.
* Dùng \`filetype:pdf cụm từ\`: Chỉ tìm kiếm các tài liệu có định dạng PDF.`,
    imageUrl: "https://picsum.photos/seed/internet/800/400"
  },
  {
    id: "lo-2",
    moduleId: "LO",
    topic: "Email",
    title: "Giao tiếp chuyên nghiệp thông qua Email",
    content: `### 1. Cấu trúc địa chỉ email hợp lệ
Một địa chỉ email chuẩn hóa bao gồm bôn phần: \`tên_người_dùng @ tên_miền_nhà_cung_cấp_dịch_vụ\` (Ví dụ: \`hocvien.ic3@gmail.com\`).

### 2. Phân biệt các trường gửi: To, Cc, và Bcc
* **To (Người nhận trực tiếp)**: Đối tượng nhận tin chính, cần đọc và có nghĩa vụ phản hồi nếu có yêu cầu.
* **CC (Carbon Copy - Bản sao đồng gửi)**: Gửi cho những người cần biết nội dung cuộc hội thoại để nắm bắt thông tin, không bắt buộc phản hồi trực tiếp. Tất cả người nhận trong danh sách To và CC đều **nhìn thấy địa chỉ email của nhau**.
* **BCC (Blind Carbon Copy - Bản sao gửi ẩn danh)**: Gửi nội dung cho người thứ ba một cách âm thầm. Những người ở phần TO và CC **không thể biết** và không nhìn thấy địa chỉ email của người trong danh sách BCC. Giúp bảo mật thông tin danh sách liên hệ lớn tối đa.

### 3. Nghi thức xã giao email (Netiquette)
* Luôn viết tiêu đề email đầy đủ, ngắn gọn mô tả đúng nội dung.
* Không bao giờ gõ TOÀN BỘ CHỮ HOA vì hành vi này tương đương với việc quát tháo vào mặt đối phương.
* Kiểm tra kỹ dung lượng tệp đính kèm trước khi bấm gửi.`,
    imageUrl: "https://picsum.photos/seed/email/800/400"
  }
];

export const INITIAL_QUESTIONS: Question[] = [
  // Computing Fundamentals
  {
    id: "q-cf-1",
    moduleId: "CF",
    topic: "Phần cứng",
    type: "single-choice",
    difficulty: "easy",
    skills: ["Lưu trữ", "Bộ nhớ máy tính"],
    tags: ["RAM", "Phần cứng"],
    questionText: "Khi tắt máy tính (Shutdown), toàn bộ thông tin được lưu trữ trên linh kiện nào sau đây sẽ bị xóa sạch hoàn toàn?",
    options: [
      "A. Ổ cứng SSD (Solid State Drive)",
      "B. Bộ nhớ RAM (Random Access Memory)",
      "C. Ổ cứng HDD (Hard Disk Drive)",
      "D. Đĩa quang DVD-ROM"
    ],
    correctSingle: "B. Bộ nhớ RAM (Random Access Memory)",
    explanation: "RAM (Random Access Memory) là bộ nhớ tạm thời của máy tính (Volatile Memory). Nó mất dữ liệu hoàn toàn khi mất nguồn điện. Các thiết bị lưu trữ như SSD, HDD hay đĩa quang lưu trữ dữ liệu dạng non-volatile, tức là bảo toàn được dữ liệu ngay cả khi ngắt dòng điện.",
    referenceUrl: "https://vnu.edu.vn"
  },
  {
    id: "q-cf-2",
    moduleId: "CF",
    topic: "Quản lý dữ liệu",
    type: "multiple-response",
    difficulty: "medium",
    skills: ["Định dạng tệp tin"],
    tags: ["File extension", "Excel", "Word", "PowerPoint"],
    questionText: "Trong các phần mở rộng tập tin dưới đây, những phần mở rộng nào thuộc về phần mềm văn phòng Microsoft Office? (Chọn 3 đáp án đúng)",
    options: [
      "A. .xlsx",
      "B. .docx",
      "C. .pptx",
      "D. .mp4",
      "E. .exe"
    ],
    correctMultiple: [
      "A. .xlsx",
      "B. .docx",
      "C. .pptx"
    ],
    explanation: ".xlsx đại diện cho Microsoft Excel, .docx đại diện cho Microsoft Word, .pptx đại diện cho Microsoft PowerPoint. Trong khi đó, .mp4 là định dạng video và .exe là định dạng tệp tin thực thi cài đặt của Windows."
  },
  {
    id: "q-cf-3",
    moduleId: "CF",
    topic: "Hệ điều hành",
    type: "true-false",
    difficulty: "easy",
    skills: ["Định lý OS"],
    tags: ["Linux", "Open Source"],
    questionText: "Hệ điều hành Linux là một hệ điều hành mã nguồn mở hoàn toàn miễn phí và thường được ưa chuộng cài đặt trên các hệ thống máy chủ mạng (Server). Phát biểu này Đúng hay Sai?",
    options: ["Đúng", "Sai"],
    correctSingle: "Đúng",
    explanation: "Linux chính xác là hệ điều hành mã nguồn mở (Open Source) miễn phí, nổi tiếng với sự bảo mật và ổn định vượt trội nên được tin dùng rộng rãi trên các trung tâm server toàn cầu."
  },
  {
    id: "q-cf-4",
    moduleId: "CF",
    topic: "Phần cứng",
    type: "matching",
    difficulty: "medium",
    skills: ["Thiết bị ngoại vi"],
    tags: ["Input", "Output", "Hardware"],
    questionText: "Hãy tiến hành ghép cặp các thiết bị ngoại vi của máy tính sau đây vào đúng danh mục chức năng tương ứng Đầu vào hoặc Đầu ra của nó.",
    matchingPairs: [
      { left: "Chuột máy tính (Mouse)", right: "Thiết bị đầu vào (Input)" },
      { left: "Máy quét tài liệu (Scanner)", right: "Thiết bị đầu vào (Input)" },
      { left: "Màn hình hiển thị (Monitor)", right: "Thiết bị đầu ra (Output)" },
      { left: "Máy in màu văn phòng (Printer)", right: "Thiết bị đầu ra (Output)" }
    ],
    explanation: "Chuột và máy quét chụp hình ảnh gửi vào bên trong bộ xử lý là thiết bị đầu vào (Input). Màn hình hiển thị thông tin bằng ánh sáng và máy in thể hiện dữ liệu ra giấy vật lý là các thiết bị đầu ra (Output)."
  },
  {
    id: "q-cf-5",
    moduleId: "CF",
    topic: "Bảo mật",
    type: "drag-drop",
    difficulty: "hard",
    skills: ["Mã độc hại"],
    tags: ["Malware", "Ransomware", "Phishing", "Virus"],
    questionText: "Kéo các định nghĩa mã độc sau đây đặt vào đúng thẻ tên gọi của chúng.",
    dragItems: [
      "Mã độc tự bám gửi cơ thể vào tệp tin khác nhằm sao nhân lây nhiễm",
      "Trang giả mạo lôi kéo người dùng nhập thẻ tín dụng hoặc mật khẩu",
      "Mã độc mã hóa tệp dữ liệu rồi ép nạn nhân chuyển tiền chuộc",
      "Phần mềm dường như hữu ích nhưng thực tế mở cổng cho tin tặc"
    ],
    dragTargets: [
      { placeholder: "Virus máy tính", expectedItem: "Mã độc tự bám gửi cơ thể vào tệp tin khác nhằm sao nhân lây nhiễm" },
      { placeholder: "Ransomware (Mã khóa tống tiền)", expectedItem: "Mã độc mã hóa tệp dữ liệu rồi ép nạn nhân chuyển tiền chuộc" },
      { placeholder: "Phishing (Lừa đảo trực tuyến)", expectedItem: "Trang giả mạo lôi kéo người dùng nhập thẻ tín dụng hoặc mật khẩu" },
      { placeholder: "Trojan Horse (Ngựa Troy độc hại)", expectedItem: "Phần mềm dường như hữu ích nhưng thực tế mở cổng cho tin tặc" }
    ],
    explanation: "Virus là mã độc tự lây lan; Ransomware thực hiện tống tiền qua mã hóa; Phishing chuyên giả danh lừa tài sản thông tin; Trojan giả ngụy trang bảo vệ hoặc có ích để thâm nhập hệ thống."
  },
  
  // Hotspot Question
  {
    id: "q-ka-office-hotspot",
    moduleId: "KA",
    topic: "Word",
    type: "hotspot",
    difficulty: "medium",
    skills: ["Giao diên Word"],
    tags: ["Save", "Ribbon"],
    questionText: "Trong hình ảnh mô phỏng thanh công cụ Microsoft Word dưới đây, bạn hãy nhấp chọn chính xác vị trí của nút 'Lưu tài liệu' (Save icon). Nếu thao tác đúng, vùng chọn sẽ được đánh dấu.",
    hotspotImage: "https://picsum.photos/seed/wordinterface/800/300",
    hotspotInteractiveDesc: "Nhấp chuột vào biểu tượng Save để đạt điểm.",
    hotspots: [
      { id: "save", name: "Biểu tượng đĩa mềm (Save)", x: 45, y: 35, width: 60, height: 50, isCorrect: true },
      { id: "bold", name: "Nút chữ B (In đậm)", x: 250, y: 150, width: 40, height: 40, isCorrect: false },
      { id: "font", name: "Hộp chọn Font chữ", x: 140, y: 150, width: 100, height: 40, isCorrect: false },
      { id: "close", name: "Nút đóng ứng dụng (X)", x: 740, y: 20, width: 40, height: 40, isCorrect: false }
    ],
    explanation: "Nút Save trong bộ Microsoft Office truyền thống luôn được biểu hiện dưới hình chiếc đĩa mềm xưa cũ nằm ở góc trên cùng bên trái của thanh tiêu đề (Quick Access Toolbar)."
  },

  // Performance-Based Question
  {
    id: "q-cf-performance-os",
    moduleId: "CF",
    topic: "Hệ điều hành",
    type: "performance",
    difficulty: "hard",
    skills: ["Quản lý thư mục"],
    tags: ["Interactive", "OS Sim", "Windows Explorer"],
    questionText: "Yêu cầu thực hành thực tế: Bạn có một màn hình máy tính giả lập ổ đĩa 'C:\\IC3_STUDY'. Hãy click nút 'Tạo thư mục mới' (New Folder), sau đó đặt tên cho thư mục mới này là 'BaoCao_2026' để hoàn thiện nhiệm vụ.",
    performanceTask: {
      instruction: "Thực hiện tạo thư mục mới và đặt tên chuẩn 'BaoCao_2026' trên máy ảo Windows thu nhỏ bên dưới.",
      targetEnvironment: "os",
      initialState: {
        folders: ["Documents", "Downloads", "Templates"],
        currentInput: ""
      },
      expectedState: {
        folders: ["Documents", "Downloads", "Templates", "BaoCao_2026"]
      }
    },
    explanation: "Thao tác chuẩn xác bao gồm click nút 'Thư mục mới' để bắt đầu khởi tạo ô chứa dữ liệu trống, sau đó nhập văn bản 'BaoCao_2026' một cách nguyên văn và nhấn Enter để lưu lại thay đổi."
  },

  // Video-Based Question
  {
    id: "q-lo-video-sec",
    moduleId: "LO",
    topic: "An toàn thông tin",
    type: "video",
    difficulty: "medium",
    skills: ["Xác thực hai lớp (2FA)"],
    tags: ["2FA", "OTP", "Living Online"],
    questionText: "Hãy xem thước phim mô phỏng quy trình bảo mật tài khoản bên dưới. Sau khi hoàn thành xem phim, hãy trả lời: phương thức bảo mật tối ưu nào được diễn giải giúp bảo vệ người dùng ngay cả khi mật khẩu chính bị lộ?",
    videoSource: "Simulated_2FA_Sequence", // Rendered as an elegant mockup video player
    options: [
      "A. Sử dụng phần mềm diệt virus ngoại tuyến",
      "B. Đổi mật khẩu máy tính mỗi tuần vô điều kiện",
      "C. Kích hoạt xác thực 2 lớp (Mã OTP / Xác minh điện thoại)",
      "D. Tắt hoàn toàn kết nối Wi-Fi khi không lướt web"
    ],
    correctSingle: "C. Kích hoạt xác thực 2 lớp (Mã OTP / Xác minh điện thoại)",
    explanation: "Cơ chế 2FA (Two-Factor Authentication/Xác thực hai lớp) yêu cầu ngoài mật khẩu truyền thống, người dùng phải có thêm mã OTP động được gửi về điện thoại di động thông minh, thiết lập tường lửa phòng ngự vững chắc ngay cả khi mật khẩu tĩnh ban đầu bị lộ tặc."
  }
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: "exam-cf",
    title: "Đề Thi Thử IC3: Computing Fundamentals (Nhà cấu trúc máy tính)",
    description: "Bộ đề chuẩn hóa sát với nội dung thi thực tế của tổ chức Certiport, kiểm tra toàn bộ kỹ năng Phần cứng, Phần mềm và Hệ điều hành máy tính.",
    moduleId: "CF",
    durationMinutes: 45,
    passingScorePercent: 70,
    questions: [
      INITIAL_QUESTIONS[0], // RAM Volatile (Single Choice)
      INITIAL_QUESTIONS[1], // MS Office Extensions (Multiple Response)
      INITIAL_QUESTIONS[2], // Linux Open Source (True False)
      INITIAL_QUESTIONS[3], // Peripheral Matching (Matching)
      INITIAL_QUESTIONS[4], // Malware drag-drop (Drag-Drop)
      INITIAL_QUESTIONS[6]  // OS Explorer performance (Performance)
    ]
  },
  {
    id: "exam-ka",
    title: "Đề Thi Thử IC3: Key Applications (Ứng dụng Văn phòng)",
    description: "Khảo sát và đánh giá năng lực thao tác chuyên sâu trên bộ ứng dụng văn phòng thiết yếu: Microsoft Word, Excel và PowerPoint.",
    moduleId: "KA",
    durationMinutes: 50,
    passingScorePercent: 70,
    questions: [
      INITIAL_QUESTIONS[5] // Hotspot save icon (Hotspot)
    ]
  },
  {
    id: "exam-lo",
    title: "Đề Thi Thử IC3: Living Online (Cuộc sống Trực tuyến)",
    description: "Đánh giá khả năng hiểu biết thực tế trực tuyến bao gồm: Mạng xã hội, các giao thức bảo mật Internet, kỹ năng email và bảo vệ thông tin.",
    moduleId: "LO",
    durationMinutes: 45,
    passingScorePercent: 70,
    questions: [
      INITIAL_QUESTIONS[7] // 2FA Simulated Video (Video Based)
    ]
  }
];

export const INITIAL_USER_LOG: UserLog = {
  id: "user-default",
  email: "nguyenhoanthao612@gmail.com",
  role: "student",
  progressPercent: 25,
  completedLessons: ["cf-1"],
  examHistory: [
    {
      examId: "exam-cf",
      title: "Đề Thi Thử IC3: Computing Fundamentals (Nhà cấu trúc máy tính)",
      score: 83,
      correctCount: 5,
      totalCount: 6,
      timeSpentSeconds: 1250,
      date: "2026-06-12",
      passed: true,
      skillPerformance: {
        "Lưu trữ": 100,
        "Định dạng tệp tin": 100,
        "Định lý OS": 100,
        "Thiết bị ngoại vi": 100,
        "Mã độc hại": 100,
        "Quản lý thư mục": 0
      }
    }
  ]
};
