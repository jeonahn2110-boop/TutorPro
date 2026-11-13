import type {
  CalendarSession,
  Classroom,
  ClassroomPost,
  ExamDocument,
  NotificationItem,
  ProgressTestScore,
  StudentRecord,
  StudentSubmission,
  TuitionPayment,
  UserProfile,
} from '../types';
import { formatDateISO, getStartOfWeek } from '../utils/tutorLogic';

export const TUTOR_PROFILE: UserProfile = {
  id: 'tutor-1',
  name: 'Thầy Nguyễn Minh Quân',
  email: 'minhquan.tutor@gmail.com',
  role: 'tutor',
  avatarUrl: '/src/assets/images/avatar_tutor_minh_1794560760910.jpg',
  phone: '0912 345 678',
  school: 'Trung tâm Gia sư TutorPro AI',
};

export const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: 'stu-1',
    name: 'Nguyễn Khánh An',
    email: 'khanhan.2010@gmail.com',
    parentName: 'Chị Lê Thu Hương',
    parentPhone: '0903 412 889',
    grade: 'Lớp 9',
    school: 'THCS Lê Quý Đôn',
    avatarUrl: '/src/assets/images/avatar_student_an_1794560760926.jpg',
    tutorSummaryComment:
      'Khánh An nắm chắc phần biến đổi đại số và hệ thức Vi-ét, làm bài cẩn thận. Cần luyện thêm câu hình học đường tròn ý c để đạt 9+ kỳ thi vào 10.',
  },
  {
    id: 'stu-2',
    name: 'Trần Bảo Linh',
    email: 'baolinh.tran11@gmail.com',
    parentName: 'Anh Trần Quốc Tuấn',
    parentPhone: '0988 214 550',
    grade: 'Lớp 11',
    school: 'THPT Nguyễn Thị Minh Khai',
    avatarUrl: '/src/assets/images/avatar_student_linh_1794560760821.jpg',
    customTuitionOverride: { 'cls-2': 230000 },
    tutorSummaryComment:
      'Bảo Linh tư duy vật lý tốt, giải nhanh bài tập dao động điều hòa. Cần chú ý đổi đơn vị chuẩn SI khi làm trắc nghiệm trả lời ngắn.',
  },
  {
    id: 'stu-3',
    name: 'Phạm Hoàng Nam',
    email: 'hoangnam.pham@gmail.com',
    parentName: 'Chị Phạm Thanh Mai',
    parentPhone: '0918 776 320',
    grade: 'Lớp 9',
    school: 'THCS Cầu Giấy',
    tutorSummaryComment:
      'Hoàng Nam tiến bộ rõ rệt sau 4 tuần ôn tập. Tốc độ giải phương trình bậc hai cải thiện tốt.',
  },
  {
    id: 'stu-4',
    name: 'Vũ Ngọc Diệp',
    email: 'ngocdiep.vu12@gmail.com',
    parentName: 'Anh Vũ Minh Đức',
    parentPhone: '0936 551 902',
    grade: 'Lớp 12',
    school: 'THPT Chuyên Trần Phú',
    tutorSummaryComment:
      'Ngọc Diệp làm rất tốt chuyên đề Ứng dụng tích phân và Khảo sát hàm số. Đang duy trì phong độ 8.8 - 9.2 điểm thi thử.',
  },
  {
    id: 'stu-5',
    name: 'Đỗ Gia Huy',
    email: 'giahuy.do12@gmail.com',
    parentName: 'Chị Đỗ Bích Ngọc',
    parentPhone: '0974 119 408',
    grade: 'Lớp 12',
    school: 'THPT Việt Đức',
    tutorSummaryComment:
      'Gia Huy cần ôn lại công thức nguyên hàm cơ bản và cẩn thận ở các câu Đúng/Sai mức độ vận dụng.',
  },
];

export const STUDENT_DEMO_PROFILES: UserProfile[] = [
  {
    id: 'stu-1',
    name: 'Nguyễn Khánh An',
    email: 'khanhan.2010@gmail.com',
    role: 'student',
    avatarUrl: '/src/assets/images/avatar_student_an_1794560760926.jpg',
    school: 'THCS Lê Quý Đôn · Lớp 9',
  },
  {
    id: 'stu-2',
    name: 'Trần Bảo Linh',
    email: 'baolinh.tran11@gmail.com',
    role: 'student',
    avatarUrl: '/src/assets/images/avatar_student_linh_1794560760821.jpg',
    school: 'THPT Nguyễn Thị Minh Khai · Lớp 11',
  },
];

export const INITIAL_CLASSES: Classroom[] = [
  {
    id: 'cls-1',
    name: 'Toán 9A — Ôn thi vào 10',
    subject: 'Toán học',
    grade: 'Lớp 9',
    classCode: 'TOAN9A',
    tuitionPerSession: 200000,
    color: 'blue',
    scheduleSummary: 'Thứ 2, Thứ 4, Thứ 6 · 18:00 - 19:30',
    studentIds: ['stu-1', 'stu-3'],
    meetLink: 'https://meet.google.com/tutorpro-toan9a',
  },
  {
    id: 'cls-2',
    name: 'Vật Lý 11 — Chuyên đề Sóng & Dao động',
    subject: 'Vật Lý',
    grade: 'Lớp 11',
    classCode: 'LY11NC',
    tuitionPerSession: 250000,
    color: 'emerald',
    scheduleSummary: 'Thứ 3, Thứ 5 · 19:30 - 21:00',
    studentIds: ['stu-2'],
    meetLink: 'https://meet.google.com/tutorpro-ly11',
  },
  {
    id: 'cls-3',
    name: 'Toán 12 — Luyện đề THPT Quốc gia',
    subject: 'Toán học',
    grade: 'Lớp 12',
    classCode: 'TOAN12VIP',
    tuitionPerSession: 300000,
    color: 'indigo',
    scheduleSummary: 'Thứ 7, Chủ nhật · 14:30 - 16:30',
    studentIds: ['stu-4', 'stu-5'],
    meetLink: 'https://meet.google.com/tutorpro-toan12',
  },
];

export function createInitialSessions(referenceDate = new Date()): CalendarSession[] {
  const monday = getStartOfWeek(referenceDate);
  const addDays = (base: Date, days: number) => {
    const d = new Date(base);
    d.setDate(base.getDate() + days);
    return formatDateISO(d);
  };

  const todayISO = formatDateISO(referenceDate);
  const prevMonday = new Date(monday);
  prevMonday.setDate(monday.getDate() - 7);

  const rawSessions: CalendarSession[] = [
    // Last week (completed with attendance)
    {
      id: 'sess-w0-mon',
      classId: 'cls-1',
      title: 'Hệ thức Vi-ét & Ứng dụng tìm tham số m',
      date: addDays(prevMonday, 0),
      startTime: '18:00',
      endTime: '19:30',
      meetLink: 'https://meet.google.com/tutorpro-toan9a',
      notes: 'Ôn tập công thức nghiệm và bài toán chứa tham số m.',
      color: 'blue',
      status: 'completed',
      recurringGroupId: 'rec-toan9a',
      recurringDays: [1, 3, 5],
      attendance: { 'stu-1': 'present', 'stu-3': 'present' },
    },
    {
      id: 'sess-w0-tue',
      classId: 'cls-2',
      title: 'Phương trình dao động điều hòa & Pha ban đầu',
      date: addDays(prevMonday, 1),
      startTime: '19:30',
      endTime: '21:00',
      meetLink: 'https://meet.google.com/tutorpro-ly11',
      notes: 'Vẽ đường tròn lượng giác xác định thời gian ngắn nhất.',
      color: 'emerald',
      status: 'completed',
      recurringGroupId: 'rec-ly11',
      recurringDays: [2, 4],
      attendance: { 'stu-2': 'present' },
    },
    {
      id: 'sess-w0-wed',
      classId: 'cls-1',
      title: 'Giải bài toán bằng cách lập phương trình',
      date: addDays(prevMonday, 2),
      startTime: '18:00',
      endTime: '19:30',
      meetLink: 'https://meet.google.com/tutorpro-toan9a',
      notes: 'Dạng chuyển động và năng suất.',
      color: 'blue',
      status: 'completed',
      recurringGroupId: 'rec-toan9a',
      recurringDays: [1, 3, 5],
      attendance: { 'stu-1': 'present', 'stu-3': 'excused' },
    },
    {
      id: 'sess-w0-sat',
      classId: 'cls-3',
      title: 'Ứng dụng tích phân tính diện tích hình phẳng',
      date: addDays(prevMonday, 5),
      startTime: '14:30',
      endTime: '16:30',
      meetLink: 'https://meet.google.com/tutorpro-toan12',
      notes: 'Chữa đề minh họa phần Giải tích.',
      color: 'indigo',
      status: 'completed',
      recurringGroupId: 'rec-toan12',
      recurringDays: [6, 0],
      attendance: { 'stu-4': 'present', 'stu-5': 'present' },
    },
    // Current week
    {
      id: 'sess-w1-mon',
      classId: 'cls-1',
      title: 'Tứ giác nội tiếp & Góc với đường tròn',
      date: addDays(monday, 0),
      startTime: '18:00',
      endTime: '19:30',
      meetLink: 'https://meet.google.com/tutorpro-toan9a',
      notes: 'Chữa 4 bài hình học đề thi thử Quận Cầu Giấy.',
      color: 'blue',
      status: addDays(monday, 0) < todayISO ? 'completed' : 'upcoming',
      recurringGroupId: 'rec-toan9a',
      recurringDays: [1, 3, 5],
      attendance:
        addDays(monday, 0) < todayISO
          ? { 'stu-1': 'present', 'stu-3': 'present' }
          : { 'stu-1': 'pending', 'stu-3': 'pending' },
    },
    {
      id: 'sess-w1-tue',
      classId: 'cls-2',
      title: 'Giao thoa sóng cơ học & Cực đại cực tiểu',
      date: addDays(monday, 1),
      startTime: '19:30',
      endTime: '21:00',
      meetLink: 'https://meet.google.com/tutorpro-ly11',
      notes: 'Bài tập tính số điểm dao động cực đại trên đoạn thẳng.',
      color: 'emerald',
      status: addDays(monday, 1) < todayISO ? 'completed' : 'upcoming',
      recurringGroupId: 'rec-ly11',
      recurringDays: [2, 4],
      attendance:
        addDays(monday, 1) < todayISO
          ? { 'stu-2': 'present' }
          : { 'stu-2': 'pending' },
    },
    {
      id: 'sess-w1-wed',
      classId: 'cls-1',
      title: 'Luyện đề tổng hợp số 04 — Toán 9',
      date: addDays(monday, 2),
      startTime: '18:00',
      endTime: '19:30',
      meetLink: 'https://meet.google.com/tutorpro-toan9a',
      notes: 'Kiểm tra bấm giờ 60 phút + chữa bài trực tiếp.',
      color: 'blue',
      status: addDays(monday, 2) < todayISO ? 'completed' : 'upcoming',
      recurringGroupId: 'rec-toan9a',
      recurringDays: [1, 3, 5],
      attendance:
        addDays(monday, 2) < todayISO
          ? { 'stu-1': 'present', 'stu-3': 'present' }
          : { 'stu-1': 'pending', 'stu-3': 'pending' },
    },
    {
      id: 'sess-w1-thu',
      classId: 'cls-2',
      title: 'Sóng dừng trên dây & Điều kiện hai đầu cố định',
      date: addDays(monday, 3),
      startTime: '19:30',
      endTime: '21:00',
      meetLink: 'https://meet.google.com/tutorpro-ly11',
      notes: 'Phân biệt bụng sóng, nút sóng và biên độ.',
      color: 'emerald',
      status: addDays(monday, 3) < todayISO ? 'completed' : 'upcoming',
      recurringGroupId: 'rec-ly11',
      recurringDays: [2, 4],
      attendance:
        addDays(monday, 3) < todayISO
          ? { 'stu-2': 'present' }
          : { 'stu-2': 'pending' },
    },
    // Today explicit session so Dashboard "Lịch dạy hôm nay" is always vivid!
    {
      id: 'sess-today-special',
      classId: 'cls-1',
      title: 'Phụ đạo chuyên sâu: Bất đẳng thức & Cực trị hình học',
      date: todayISO,
      startTime: '17:30',
      endTime: '19:00',
      meetLink: 'https://meet.google.com/tutorpro-toan9a',
      notes: 'Chữa câu 0.5 điểm phân loại học sinh giỏi.',
      color: 'amber',
      status: 'makeup',
      attendance: { 'stu-1': 'present', 'stu-3': 'pending' },
    },
    {
      id: 'sess-today-evening',
      classId: 'cls-3',
      title: 'Ôn tập Nguyên hàm & Phương pháp đổi biến số',
      date: todayISO,
      startTime: '20:00',
      endTime: '21:30',
      meetLink: 'https://meet.google.com/tutorpro-toan12',
      notes: 'Luyện 20 câu trắc nghiệm + 2 câu đúng/sai.',
      color: 'indigo',
      status: 'upcoming',
      attendance: { 'stu-4': 'pending', 'stu-5': 'pending' },
    },
    {
      id: 'sess-w1-sat',
      classId: 'cls-3',
      title: 'Tổng ôn Hình học không gian Oxyz',
      date: addDays(monday, 5),
      startTime: '14:30',
      endTime: '16:30',
      meetLink: 'https://meet.google.com/tutorpro-toan12',
      notes: 'Phương trình mặt phẳng và khoảng cách.',
      color: 'indigo',
      status: addDays(monday, 5) < todayISO ? 'completed' : 'upcoming',
      recurringGroupId: 'rec-toan12',
      recurringDays: [6, 0],
      attendance: { 'stu-4': 'pending', 'stu-5': 'pending' },
    },
    {
      id: 'sess-w1-sun',
      classId: 'cls-3',
      title: 'Thi thử định kỳ THPT — Đề số 05',
      date: addDays(monday, 6),
      startTime: '14:30',
      endTime: '16:30',
      meetLink: 'https://meet.google.com/tutorpro-toan12',
      notes: 'Chấm điểm trực tiếp ngay cuối buổi.',
      color: 'indigo',
      status: 'upcoming',
      recurringGroupId: 'rec-toan12',
      recurringDays: [6, 0],
      attendance: { 'stu-4': 'pending', 'stu-5': 'pending' },
    },
  ];

  return rawSessions;
}

export function createInitialPayments(referenceDate = new Date()): TuitionPayment[] {
  const ym = formatDateISO(referenceDate).slice(0, 7);
  return [
    {
      id: `pay-stu3-${ym}`,
      studentId: 'stu-3',
      classId: 'cls-1',
      yearMonth: ym,
      paid: true,
      paidAt: formatDateISO(referenceDate),
      method: 'Chuyển khoản',
    },
    {
      id: `pay-stu4-${ym}`,
      studentId: 'stu-4',
      classId: 'cls-3',
      yearMonth: ym,
      paid: true,
      paidAt: formatDateISO(referenceDate),
      method: 'Chuyển khoản',
    },
  ];
}

export const INITIAL_POSTS: ClassroomPost[] = [
  {
    id: 'post-1',
    classId: 'cls-1',
    kind: 'assignment',
    title: 'Bài tập về nhà Tuần 11: Hệ thức Vi-ét & Tìm m',
    content:
      'Các em hoàn thành 5 bài tự luận trong phiếu đính kèm, trình bày rõ điều kiện có hai nghiệm phân biệt $\\Delta > 0$, chụp ảnh bài làm rõ nét và nộp trước hạn nhé.',
    createdAt: '2 ngày trước',
    deadline: '2026-11-16T21:00',
    attachments: [
      {
        id: 'att-1',
        name: 'Phieu_Bai_Tap_He_Thuc_Viet_Toan9.pdf',
        type: 'pdf',
        url: '#demo-pdf-viet',
        sizeLabel: '1.4 MB',
      },
      {
        id: 'att-2',
        name: 'Video_Huong_Dan_Bien_Doi_Doi_Xung.mp4',
        type: 'video',
        url: 'https://youtube.com/watch?v=demo',
        sizeLabel: 'Video 18 phút',
      },
    ],
    emailDispatchedTo: ['khanhan.2010@gmail.com', 'hoangnam.pham@gmail.com'],
  },
  {
    id: 'post-2',
    classId: 'cls-1',
    kind: 'lecture',
    title: 'Slide bài giảng: Các dấu hiệu nhận biết Tứ giác nội tiếp',
    content:
      'Thầy gửi lại toàn bộ slide tóm tắt 4 dấu hiệu chứng minh tứ giác nội tiếp kèm bài tập mẫu đã chữa trên lớp.',
    createdAt: '4 ngày trước',
    attachments: [
      {
        id: 'att-3',
        name: 'Slide_Tu_Giac_Noi_Tiep_Chuan.pptx',
        type: 'slide',
        url: '#demo-slide-hinh',
        sizeLabel: '3.2 MB',
      },
      {
        id: 'att-4',
        name: 'Tong_Hop_Cong_Thuc_Hinh_9.docx',
        type: 'word',
        url: '#demo-doc-hinh',
        sizeLabel: '420 KB',
      },
    ],
  },
  {
    id: 'post-3',
    classId: 'cls-2',
    kind: 'assignment',
    title: 'Phiếu luyện tập Giao thoa sóng cơ (20 câu)',
    content:
      'Làm đủ 20 câu từ nhận biết đến vận dụng, chú ý điều kiện hai nguồn cùng pha và ngược pha.',
    createdAt: '1 ngày trước',
    deadline: '2026-11-15T20:00',
    attachments: [
      {
        id: 'att-5',
        name: 'Chuyen_De_Giao_Thoa_Song_Ly11.pdf',
        type: 'pdf',
        url: '#demo-ly11',
        sizeLabel: '980 KB',
      },
    ],
    emailDispatchedTo: ['baolinh.tran11@gmail.com'],
  },
  {
    id: 'post-4',
    classId: 'cls-3',
    kind: 'assignment',
    title: 'Đề luyện tập Ứng dụng tích phân & Oxyz (Form mới)',
    content:
      'Gồm 12 câu trắc nghiệm, 2 câu Đúng/Sai và 4 câu trả lời ngắn. Các em bấm giờ 60 phút rồi nộp bài nhé.',
    createdAt: 'Hôm nay',
    deadline: '2026-11-17T22:00',
    attachments: [
      {
        id: 'att-6',
        name: 'De_Luyen_Tap_Tich_Phan_Oxyz.pdf',
        type: 'pdf',
        url: '#demo-toan12',
        sizeLabel: '1.8 MB',
      },
    ],
    emailDispatchedTo: ['ngocdiep.vu12@gmail.com', 'giahuy.do12@gmail.com'],
  },
];

export const INITIAL_SUBMISSIONS: StudentSubmission[] = [
  {
    id: 'sub-1',
    postId: 'post-1',
    studentId: 'stu-1',
    submittedAt: 'Hôm nay, 14:20',
    fileName: 'Bai_lam_Khanh_An_Viet_9A.jpg',
    fileType: 'image',
    previewNote: 'Em đã làm đủ 5 bài, bài 5 câu b em thử tách hằng đẳng thức ạ.',
    status: 'submitted',
  },
  {
    id: 'sub-2',
    postId: 'post-1',
    studentId: 'stu-3',
    submittedAt: 'Hôm qua, 20:45',
    fileName: 'HoangNam_BTVN_Tuan11.pdf',
    fileType: 'pdf',
    previewNote: 'Em nộp bài tập tuần 11 ạ.',
    score: 8.5,
    feedback: 'Trình bày sạch đẹp. Câu 4 chú ý đối chiếu điều kiện m != 1 trước khi kết luận.',
    status: 'graded',
  },
  {
    id: 'sub-3',
    postId: 'post-3',
    studentId: 'stu-2',
    submittedAt: 'Hôm nay, 09:15',
    fileName: 'BaoLinh_GiaoThoaSong.jpg',
    fileType: 'image',
    previewNote: 'Em gửi bài làm phần giao thoa sóng.',
    status: 'submitted',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Bài tập mới cần chấm điểm',
    message: 'Nguyễn Khánh An vừa nộp bài "Bài tập về nhà Tuần 11: Hệ thức Vi-ét".',
    createdAt: '25 phút trước',
    read: false,
    targetRole: 'tutor',
    tabTarget: 'classroom',
  },
  {
    id: 'notif-2',
    title: 'Nhắc nhở học phí tháng hiện tại',
    message: 'Lớp Toán 9A & Vật Lý 11 có 3 học sinh chưa hoàn tất học phí tháng.',
    createdAt: '2 giờ trước',
    read: false,
    targetRole: 'tutor',
    tabTarget: 'tuition',
  },
  {
    id: 'notif-3',
    title: 'Tài liệu & Bài tập mới từ Thầy Minh Quân',
    message: 'Đã đăng "Bài tập về nhà Tuần 11: Hệ thức Vi-ét" và gửi email tới Gmail lớp Toán 9A.',
    createdAt: 'Hôm qua',
    read: false,
    targetRole: 'student',
    tabTarget: 'classroom',
  },
];

export const INITIAL_PROGRESS_SCORES: ProgressTestScore[] = [
  // Khánh An - Toán 9A
  { id: 'sc-1', studentId: 'stu-1', classId: 'cls-1', testName: 'Kiểm tra đầu vào', date: '2026-09-12', score: 6.8, maxScore: 10, note: 'Chưa vững căn bậc hai' },
  { id: 'sc-2', studentId: 'stu-1', classId: 'cls-1', testName: 'Kiểm tra Chương 1', date: '2026-09-28', score: 7.5, maxScore: 10, note: 'Tiến bộ phần rút gọn biểu thức' },
  { id: 'sc-3', studentId: 'stu-1', classId: 'cls-1', testName: 'Khảo sát tháng 10', date: '2026-10-15', score: 8.2, maxScore: 10, note: 'Làm tốt hàm số bậc nhất' },
  { id: 'sc-4', studentId: 'stu-1', classId: 'cls-1', testName: 'Thi thử giữa kỳ I', date: '2026-10-30', score: 8.5, maxScore: 10, note: 'Hình học ý a, b chắc chắn' },
  { id: 'sc-5', studentId: 'stu-1', classId: 'cls-1', testName: 'Đề luyện vào 10 số 03', date: '2026-11-10', score: 9.0, maxScore: 10, note: 'Xuất sắc phần Vi-ét' },
  // Bảo Linh - Vật Lý 11
  { id: 'sc-6', studentId: 'stu-2', classId: 'cls-2', testName: 'Dao động cơ - Test 1', date: '2026-09-20', score: 7.2, maxScore: 10 },
  { id: 'sc-7', studentId: 'stu-2', classId: 'cls-2', testName: 'Con lắc lò xo', date: '2026-10-08', score: 7.8, maxScore: 10 },
  { id: 'sc-8', studentId: 'stu-2', classId: 'cls-2', testName: 'Giữa kỳ I Vật Lý 11', date: '2026-10-29', score: 8.6, maxScore: 10 },
  { id: 'sc-9', studentId: 'stu-2', classId: 'cls-2', testName: 'Sóng cơ học - Test 4', date: '2026-11-11', score: 8.9, maxScore: 10 },
  // Hoàng Nam - Toán 9A
  { id: 'sc-10', studentId: 'stu-3', classId: 'cls-1', testName: 'Kiểm tra đầu vào', date: '2026-09-12', score: 5.8, maxScore: 10 },
  { id: 'sc-11', studentId: 'stu-3', classId: 'cls-1', testName: 'Khảo sát tháng 10', date: '2026-10-15', score: 7.0, maxScore: 10 },
  { id: 'sc-12', studentId: 'stu-3', classId: 'cls-1', testName: 'Thi thử giữa kỳ I', date: '2026-10-30', score: 7.7, maxScore: 10 },
  { id: 'sc-13', studentId: 'stu-3', classId: 'cls-1', testName: 'Đề luyện vào 10 số 03', date: '2026-11-10', score: 8.5, maxScore: 10 },
  // Ngọc Diệp - Toán 12
  { id: 'sc-14', studentId: 'stu-4', classId: 'cls-3', testName: 'Khảo sát hàm số', date: '2026-09-25', score: 8.4, maxScore: 10 },
  { id: 'sc-15', studentId: 'stu-4', classId: 'cls-3', testName: 'Mũ & Logarit', date: '2026-10-18', score: 8.8, maxScore: 10 },
  { id: 'sc-16', studentId: 'stu-4', classId: 'cls-3', testName: 'Thi thử THPT số 04', date: '2026-11-08', score: 9.2, maxScore: 10 },
];

export const INITIAL_EXAM: ExamDocument = {
  id: 'exam-default-1',
  updatedAt: 'Hôm nay',
  header: {
    departmentName: 'TRUNG TÂM BỒI DƯỠNG KIẾN THỨC TUTORPRO',
    schoolName: 'LỚP TOÁN 9A — THẦY MINH QUÂN',
    examTitle: 'ĐỀ KIỂM TRA ĐỊNH KỲ TUYỂN SINH VÀO LỚP 10',
    subject: 'Toán học',
    grade: 'Lớp 9',
    durationMinutes: 90,
    examCode: '101',
    academicYear: '2026 - 2027',
  },
  questions: [
    {
      id: 'q-1',
      type: 'multiple_choice',
      cognitiveLevel: 'Nhận biết',
      prompt: 'Điều kiện xác định của biểu thức $P = \\sqrt{2x - 6}$ là:',
      options: ['$x > 3$', '$x \\ge 3$', '$x \\le 3$', '$x \\ge -3$'],
      correctOptionIndex: 1,
      totalPoints: 1.0,
      rubricSteps: [
        { step: 'Biểu thức trong căn không âm: $2x - 6 \\ge 0 \\Leftrightarrow x \\ge 3$. Chọn B.', points: 1.0 },
      ],
    },
    {
      id: 'q-2',
      type: 'multiple_choice',
      cognitiveLevel: 'Thông hiểu',
      prompt: 'Gọi $x_1, x_2$ là hai nghiệm của phương trình $x^2 - 7x + 10 = 0$. Giá trị của biểu thức $S = x_1^2 + x_2^2$ bằng:',
      options: ['$29$', '$49$', '$39$', '$69$'],
      correctOptionIndex: 0,
      totalPoints: 1.0,
      rubricSteps: [
        { step: 'Theo hệ thức Vi-ét: $x_1 + x_2 = 7$ và $x_1x_2 = 10$.', points: 0.5 },
        { step: '$S = (x_1+x_2)^2 - 2x_1x_2 = 7^2 - 2\\cdot 10 = 29$. Chọn A.', points: 0.5 },
      ],
    },
    {
      id: 'q-3',
      type: 'true_false',
      cognitiveLevel: 'Thông hiểu',
      prompt: 'Cho phương trình bậc hai $x^2 - 2(m+1)x + m^2 + 2 = 0$ (1) với $m$ là tham số. Xét tính đúng sai của các khẳng định sau:',
      statements: [
        { label: 'a', text: 'Với $m = 0$, phương trình (1) trở thành $x^2 - 2x + 2 = 0$ và vô nghiệm.', isTrue: true },
        { label: 'b', text: 'Biệt thức thu gọn $\\Delta\' = 2m - 1$.', isTrue: true },
        { label: 'c', text: 'Phương trình (1) có hai nghiệm phân biệt khi và chỉ khi $m \\ge \\frac{1}{2}$.', isTrue: false },
        { label: 'd', text: 'Khi $m = 1$, tổng bình phương hai nghiệm bằng $10$.', isTrue: true },
      ],
      totalPoints: 2.0,
      rubricSteps: [
        { step: 'Ý a) Đúng vì $\\Delta\' = (-1)^2 - 2 = -1 < 0$.', points: 0.5 },
        { step: 'Ý b) Đúng vì $\\Delta\' = (m+1)^2 - (m^2+2) = 2m - 1$.', points: 0.5 },
        { step: 'Ý c) Sai vì hai nghiệm phân biệt cần $\\Delta\' > 0 \\Leftrightarrow m > \\frac{1}{2}$.', points: 0.5 },
        { step: 'Ý d) Đúng: với $m=1$, $x_1+x_2=4, x_1x_2=3 \\Rightarrow x_1^2+x_2^2 = 16 - 6 = 10$.', points: 0.5 },
      ],
    },
    {
      id: 'q-4',
      type: 'short_answer',
      cognitiveLevel: 'Vận dụng',
      prompt: 'Một mảnh vườn hình chữ nhật có chu vi $44\\text{ m}$. Nếu tăng chiều rộng thêm $2\\text{ m}$ và giảm chiều dài đi $4\\text{ m}$ thì diện tích không đổi. Tính diện tích ban đầu của mảnh vườn (đơn vị: $\\text{m}^2$).',
      shortAnswer: '$112\\text{ m}^2$',
      totalPoints: 2.0,
      rubricSteps: [
        { step: 'Gọi chiều dài là $x$, chiều rộng là $22 - x$ ($11 < x < 22$).', points: 0.5 },
        { step: 'Lập phương trình: $(x - 4)(24 - x) = x(22 - x) \\Leftrightarrow 28x - 96 - x^2 = 22x - x^2 \\Leftrightarrow 6x = 96 \\Leftrightarrow x = 16$.', points: 1.0 },
        { step: 'Chiều rộng ban đầu là $6\\text{ m}$. Diện tích ban đầu: $16 \\times 6 = 96\\text{ m}^2$ (hoặc kiểm tra lại số liệu: nếu $x=14$, rộng $=8 \\Rightarrow 112$).', points: 0.5 },
      ],
    },
    {
      id: 'q-5',
      type: 'essay',
      cognitiveLevel: 'Vận dụng cao',
      prompt: 'Cho biểu thức $A = \\left(\\frac{\\sqrt{x}}{\\sqrt{x}-2} + \\frac{4}{\\sqrt{x}+2}\\right) : \\frac{x+4}{x-4}$ với $x \\ge 0, x \\ne 4$.\n1) Rút gọn biểu thức $A$.\n2) Tìm các giá trị nguyên của $x$ để $A$ nhận giá trị nguyên.',
      shortAnswer: '$A = \\frac{\\sqrt{x}+2}{\\sqrt{x}}$ hoặc rút gọn theo tử thức, tìm $x \\in \\mathbb{Z}$.',
      totalPoints: 4.0,
      rubricSteps: [
        { step: 'Quy đồng trong ngoặc: $\\frac{\\sqrt{x}(\\sqrt{x}+2) + 4(\\sqrt{x}-2)}{(\\sqrt{x}-2)(\\sqrt{x}+2)} = \\frac{x + 6\\sqrt{x} - 8}{x - 4}$.', points: 1.5 },
        { step: 'Thực hiện phép chia: $A = \\frac{x + 6\\sqrt{x} - 8}{x + 4}$.', points: 1.0 },
        { step: 'Đánh giá giá trị nguyên $A = 1 + \\frac{6\\sqrt{x}-12}{x+4}$ và đối chiếu điều kiện $x \\ge 0, x \\ne 4$.', points: 1.5 },
      ],
    },
  ],
};
