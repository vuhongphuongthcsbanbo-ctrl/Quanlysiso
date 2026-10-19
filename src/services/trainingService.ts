import { AttendanceReport, SessionType } from '../types';
import { getTodayDateString } from '../utils/formatters';

export const TRAINING_STORAGE_KEYS = {
  TRAINING_MODE: 'thcs_banbo_training_mode_active',
  TRAINING_REPORTS: 'thcs_banbo_training_reports',
  QUIZ_RESULTS: 'thcs_banbo_training_quiz_results',
  ACTIVE_SCENARIO: 'thcs_banbo_active_scenario',
};

export interface TrainingScenario {
  id: string;
  code: string;
  title: string;
  targetRole: string;
  difficulty: 'CƠ BẢN' | 'TRUNG BÌNH' | 'NÂNG CAO';
  timeEstimate: string;
  context: string;
  objectives: string[];
  steps: string[];
  expectedResult: string;
  sampleClassId: string;
  sampleClassName: string;
  session: SessionType;
  absentCount: number;
  sampleAbsentees: Array<{
    name: string;
    reason: string;
    isAuthorized: boolean;
    boardingStatus: string;
  }>;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: 'QUY_CHE_GIO' | 'NGHIEP_VU_GVCN' | 'BAN_TRU' | 'KY_THUAT_OFFLINE' | 'BAN_GIAM_HIEU';
}

export const TRAINING_SCENARIOS: TrainingScenario[] = [
  {
    id: 'sc_01',
    code: 'KB-01',
    title: 'GVCN Báo Sĩ Số: Lớp có 2 học sinh vắng (1 ốm có phép, 1 không phép)',
    targetRole: 'Giáo viên Chủ nhiệm',
    difficulty: 'CƠ BẢN',
    timeEstimate: '3 phút',
    context: 'Đầu giờ sáng lúc 07:02, GVCN lớp 7A2 vào lớp điểm danh. Lớp sĩ số 38 em, có em Lò Văn Dũng sốt cao phụ huynh đã xin phép qua Zalo; em Thào Thị Mỷ chưa thấy đến lớp và chưa liên lạc được với phụ huynh.',
    objectives: [
      'Thao tác mở giao diện Báo sĩ số sáng trước 07:15',
      'Đánh dấu 2 học sinh vắng trong danh sách lớp',
      'Phân loại đúng: 1 em "Có phép - Ốm đau" và 1 em "Không phép"',
      'Xác nhận số lượng học sinh bán trú ăn trưa và gửi báo cáo',
    ],
    steps: [
      'Bước 1: Bật Chế độ Tập huấn và chuyển sang tài khoản GVCN lớp 7A2 (Cô Lò Thị Thu).',
      'Bước 2: Bấm nút "BÁO SĨ SỐ" trên thanh điều hướng hoặc màn hình chính.',
      'Bước 3: Nhấp vào tên em Lò Văn Dũng -> chọn lý do "Ốm đau / Sức khỏe" (Có phép).',
      'Bước 4: Nhấp vào tên em Thào Thị Mỷ -> chọn lý do "Không phép / Chưa rõ lý do".',
      'Bước 5: Kiểm tra số liệu sĩ số hiện diện (36/38) và suất ăn bán trú, bấm "XÁC NHẬN VÀ GỬI BÁO CÁO".',
    ],
    expectedResult: 'Báo cáo được ghi nhận thành công với trạng thái "Đã nộp đúng hạn", số vắng 2 (1 có phép, 1 không phép), sẵn sàng cho BGH phê duyệt.',
    sampleClassId: 'class_7a2',
    sampleClassName: '7A2',
    session: 'MORNING',
    absentCount: 2,
    sampleAbsentees: [
      { name: 'Lò Văn Dũng', reason: 'Sốt cao, phụ huynh xin phép', isAuthorized: true, boardingStatus: 'Bán trú' },
      { name: 'Thào Thị Mỷ', reason: 'Chưa thấy đến lớp, chưa liên lạc được', isAuthorized: false, boardingStatus: 'Ngoại trú' },
    ],
  },
  {
    id: 'sc_02',
    code: 'KB-02',
    title: 'Điểm danh Bán trú Trưa & Học sinh Ngoại trú đăng ký ăn trưa phát sinh',
    targetRole: 'GVCN & Cán bộ Bán trú / Nhà bếp',
    difficulty: 'TRUNG BÌNH',
    timeEstimate: '4 phút',
    context: 'Lớp 8A1 có 30 học sinh diện Bán trú Nhà nước hỗ trợ. Hôm nay trời mưa to sạt đường, có thêm 2 em học sinh diện Ngoại trú ở bản Nậm Lò xin ở lại trường ăn trưa cùng bạn để học ca chiều.',
    objectives: [
      'Kiểm soát chính xác sĩ số ăn trưa thực tế tại trường',
      'Ghi nhận học sinh ngoại trú ăn trưa bổ sung',
      'Đảm bảo số liệu ăn trưa truyền đến Nhà bếp trước 07:30 để kịp nấu nướng',
    ],
    steps: [
      'Bước 1: Chọn lớp 8A1 trong Chế độ Tập huấn.',
      'Bước 2: Tại danh mục "Bán trú & Ăn trưa", kiểm tra danh sách 30 em bán trú chính thức.',
      'Bước 3: Tích chọn "Thêm suất ăn ngoại trú phát sinh" cho 2 học sinh.',
      'Bước 4: Nhập ghi chú: "2 em ngoại trú bản Nậm Lò ở lại ăn trưa tránh mưa đường trơn".',
      'Bước 5: Gửi báo cáo và chuyển sang vai trò Cán bộ Bếp ăn để xem số lượng khay cơm cập nhật tức thì.',
    ],
    expectedResult: 'Nhà bếp nhận đúng tổng cộng 32 suất ăn trưa, khớp 100% chi phí thực tế, không lãng phí và không thiếu khẩu phần của học sinh.',
    sampleClassId: 'class_8a1',
    sampleClassName: '8A1',
    session: 'MORNING',
    absentCount: 0,
    sampleAbsentees: [],
  },
  {
    id: 'sc_03',
    code: 'KB-03',
    title: 'Xử lý Báo cáo Sĩ số Quá hạn chót (Sau 07:15) và Quy trình Giải trình',
    targetRole: 'GVCN & Ban Giám Hiệu',
    difficulty: 'NÂNG CAO',
    timeEstimate: '5 phút',
    context: 'Lúc 07:23 (quá hạn chót 07:15), GVCN lớp 9A3 mới hoàn tất điểm danh do phải phối hợp trực tuần tiếp đón học sinh vùng sâu. Hệ thống đã kích hoạt trạng thái "QUÁ HẠN".',
    objectives: [
      'Hiểu rõ cơ chế tự động gửi cảnh báo quá hạn của hệ thống',
      'Thực hiện quy trình nộp muộn bắt buộc kèm lý do giải trình',
      'Xem xét cách BGH tiếp nhận, duyệt hoặc yêu cầu rút kinh nghiệm',
    ],
    steps: [
      'Bước 1: Tại màn hình tập huấn, thiết lập giờ mô phỏng là 07:23.',
      'Bước 2: Mở báo cáo lớp 9A3, hệ thống sẽ hiện cảnh báo: "Báo cáo nộp sau hạn chót (07:15)".',
      'Bước 3: Nhập ô giải trình bắt buộc: "Bận hỗ trợ đón học sinh điểm trường lẻ qua suối ngập, nộp muộn 8 phút".',
      'Bước 4: Bấm "NỘP BÁO CÁO MUỘN".',
      'Bước 5: Chuyển sang tài khoản Hiệu trưởng, kiểm tra thẻ cảnh báo màu cam và duyệt báo cáo kèm lưu vết audit log.',
    ],
    expectedResult: 'Hệ thống ghi nhận trạng thái "Nộp muộn", bảo toàn tính kỷ cương sư phạm và minh bạch nguyên nhân khách quan.',
    sampleClassId: 'class_9a3',
    sampleClassName: '9A3',
    session: 'MORNING',
    absentCount: 1,
    sampleAbsentees: [
      { name: 'Vàng A Tủa', reason: 'Đường sạt lở đến muộn tiết 2', isAuthorized: true, boardingStatus: 'Bán trú' },
    ],
  },
  {
    id: 'sc_04',
    code: 'KB-04',
    title: 'BGH Yêu cầu Điều chỉnh Sĩ số và Quy trình Nộp lại của GVCN',
    targetRole: 'Ban Giám Hiệu & GVCN',
    difficulty: 'NÂNG CAO',
    timeEstimate: '4 phút',
    context: 'Lớp 6A4 gửi báo cáo lúc 07:10 báo vắng em Lò Thị Hoa nhưng để trống lý do. BGH kiểm tra thấy chưa rõ tình trạng sức khỏe nên yêu cầu GVCN xác minh lại với phụ huynh.',
    objectives: [
      'BGH thao tác bấm "Yêu cầu chỉnh sửa" và gửi nội dung yêu cầu',
      'GVCN nhận thông báo chuông tức thời trên ứng dụng',
      'GVCN cập nhật thông tin chính xác và gửi lại báo cáo',
      'BGH phê duyệt bản báo cáo đã hoàn thiện',
    ],
    steps: [
      'Bước 1: Đăng nhập tài khoản BGH (Thầy Hiệu trưởng).',
      'Bước 2: Xem danh sách lớp 6A4 -> Bấm "YÊU CẦU ĐIỀU CHỈNH" -> Nhập: "Đề nghị cô giáo gọi điện phụ huynh em Hoa để nắm rõ lý do vắng".',
      'Bước 3: Chuyển sang tài khoản GVCN 6A4 -> Xem thông báo màu hổ phách.',
      'Bước 4: Bổ sung lý do: "Đã liên lạc mẹ em Hoa: em bị sốt đang theo dõi tại trạm y tế xã Bản Bo".',
      'Bước 5: Bấm "NỘP LẠI BÁO CÁO". BGH kiểm tra và bấm "PHÊ DUYỆT".',
    ],
    expectedResult: 'Quy trình đối thoại số 2 chiều giữa BGH và GVCN diễn ra khép kín, chuẩn hóa hồ sơ chuyên cần học sinh.',
    sampleClassId: 'class_6a4',
    sampleClassName: '6A4',
    session: 'MORNING',
    absentCount: 1,
    sampleAbsentees: [
      { name: 'Lò Thị Hoa', reason: 'Sốt đang theo dõi tại Trạm Y tế xã', isAuthorized: true, boardingStatus: 'Bán trú' },
    ],
  },
];

export const TRAINING_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Theo quy chế vận hành Trường THCS Bản Bo, mốc giờ HẠN CHÓT GVCN phải hoàn thành gửi báo cáo sĩ số buổi sáng là mấy giờ?',
    options: [
      '07:00 sáng',
      '07:15 sáng',
      '07:30 sáng',
      '08:00 sáng',
    ],
    correctIndex: 1,
    explanation: '07:15 là hạn chót (Deadline) nộp báo cáo sĩ số buổi sáng. Sau 07:15, hệ thống sẽ đánh dấu Nộp muộn và yêu cầu nhập lý do giải trình.',
    category: 'QUY_CHE_GIO',
  },
  {
    id: 2,
    question: 'Hệ thống tự động kích hoạt gửi thông báo nhắc nhở nộp báo cáo lần 1 đến điện thoại của GVCN vào mốc giờ nào buổi sáng?',
    options: [
      '06:45 sáng',
      '07:05 sáng',
      '07:10 sáng',
      '07:15 sáng',
    ],
    correctIndex: 1,
    explanation: 'Hệ thống tự động nhắc nhở lần 1 vào lúc 07:05 cho các lớp chưa gửi, và nhắc nhở lần 2 khẩn cấp vào lúc 07:10 (trước hạn chót 5 phút).',
    category: 'QUY_CHE_GIO',
  },
  {
    id: 3,
    question: 'Khi học sinh vắng mặt liên tiếp từ bao nhiêu ngày trở lên, hệ thống sẽ tự động bật cảnh báo ĐỎ về "Nguy cơ bỏ học / Tảo hôn" để BGH và GVCN vào cuộc?',
    options: [
      '1 ngày',
      '2 ngày',
      '3 ngày liên tiếp',
      '7 ngày liên tiếp',
    ],
    correctIndex: 2,
    explanation: 'Học sinh vắng từ 3 ngày liên tiếp (đặc biệt là học sinh dân tộc thiểu số vùng cao) sẽ được kích hoạt cảnh báo nguy cơ bỏ học để nhà trường kịp thời phối hợp trưởng bản và chính quyền xã Bản Bo đến nhà vận động.',
    category: 'NGHIEP_VU_GVCN',
  },
  {
    id: 4,
    question: 'Khi lớp học tại điểm trường mất mạng Internet hoặc 4G chập chờn, GVCN cần xử lý như thế nào?',
    options: [
      'Không cần báo nữa, chờ khi nào có mạng mới làm',
      'Nhờ học sinh chạy trực tiếp lên văn phòng trường báo miệng',
      'Vẫn thao tác điểm danh và bấm gửi bình thường; ứng dụng hỗ trợ chế độ Ngoại tuyến (Offline Mode) và sẽ tự động gửi đồng bộ ngay khi máy bắt được sóng',
      'Khởi động lại toàn bộ điện thoại và xóa dữ liệu',
    ],
    correctIndex: 2,
    explanation: 'Hệ thống THCS Bản Bo tích hợp cơ chế Offline-First & Service Worker. Khi không có mạng, dữ liệu điểm danh được lưu an toàn tại bộ nhớ máy và tự động đồng bộ lên máy chủ ngay khi có kết nối.',
    category: 'KY_THUAT_OFFLINE',
  },
  {
    id: 5,
    question: 'Khung giờ bắt đầu nhận báo cáo và hạn chót nộp báo cáo sĩ số BUỔI CHIỀU là khung giờ nào?',
    options: [
      '12:30 đến 13:00',
      '13:00 đến 13:45',
      '13:30 đến 14:15',
      '14:00 đến 14:30',
    ],
    correctIndex: 1,
    explanation: 'Buổi chiều: Bắt đầu nhận báo cáo từ 13:00, nhắc lần 1 lúc 13:25, nhắc lần 2 lúc 13:40 và hạn chót (Deadline) là 13:45.',
    category: 'QUY_CHE_GIO',
  },
  {
    id: 6,
    question: 'Số liệu chốt suất ăn trưa bán trú bắt buộc phải bàn giao cho Tổ Nuôi dưỡng / Nhà bếp trước mốc giờ nào buổi sáng để đảm bảo chất lượng bữa ăn?',
    options: [
      '06:45 sáng',
      '07:15 sáng',
      '07:30 sáng',
      '10:30 sáng',
    ],
    correctIndex: 2,
    explanation: '07:30 sáng là mốc khóa sổ và bàn giao số suất ăn trưa bán trú cho Nhà bếp nhằm phục vụ việc cân đong thực phẩm tươi sống và chuẩn bị đúng định lượng.',
    category: 'BAN_TRU',
  },
  {
    id: 7,
    question: 'Khi Ban Giám hiệu bấm "Yêu cầu chỉnh sửa" một bản báo cáo sĩ số, GVCN cần thực hiện thao tác gì tiếp theo?',
    options: [
      'Tạo một tài khoản mới để báo lại',
      'Mở xem thông báo hoặc trang chủ, đọc nội dung yêu cầu của BGH, điều chỉnh lại danh sách/lý do vắng và bấm "Nộp lại báo cáo"',
      'Không cần làm gì vì đã nộp ban đầu rồi',
      'Xóa toàn bộ lịch sử điểm danh của tháng',
    ],
    correctIndex: 1,
    explanation: 'GVCN sẽ thấy thông báo trạng thái "Yêu cầu chỉnh sửa", bấm vào để xem lý do phản hồi của BGH, cập nhật lại thông tin chuẩn xác và bấm "Nộp lại báo cáo".',
    category: 'NGHIEP_VU_GVCN',
  },
  {
    id: 8,
    question: 'Những chức danh nào có quyền thực hiện thao tác "Khóa sổ báo cáo sĩ số" (Finalize) toàn trường?',
    options: [
      'Bất kỳ giáo viên bộ môn nào',
      'Ban Giám Hiệu (Hiệu trưởng, Phó Hiệu trưởng) và Tổng Phụ Trách Đội',
      'Cán bộ Y tế và Nhân viên Nhà bếp',
      'Tổ trưởng tổ phục vụ và bảo vệ',
    ],
    correctIndex: 1,
    explanation: 'Chỉ có Ban Giám Hiệu và Tổng Phụ Trách Đội được phân quyền khóa sổ báo cáo sĩ số để đóng phiên làm việc của buổi và ban hành số liệu chính thức.',
    category: 'BAN_GIAM_HIEU',
  },
  {
    id: 9,
    question: 'Việc tách bạch chính xác giữa học sinh Bán trú (ăn trưa tại trường) và Ngoại trú tại THCS Bản Bo có ý nghĩa quan trọng nhất là gì?',
    options: [
      'Để xếp loại học lực cuối kỳ của học sinh',
      'Để đảm bảo đúng chế độ chính sách tiền ăn, tiền gạo của Nhà nước cho học sinh bán trú vùng cao và tránh lãng phí ngân sách',
      'Để phân công trực nhật trong lớp',
      'Để xếp thứ tự học sinh chào cờ đầu tuần',
    ],
    correctIndex: 1,
    explanation: 'Học sinh bán trú vùng đồng bào dân tộc thiểu số tại xã Bản Bo được hưởng các chính sách hỗ trợ tiền ăn và gạo theo Nghị định của Chính phủ. Việc báo chuẩn từng suất ăn giúp bảo vệ quyền lợi học sinh và tuân thủ quy định tài chính.',
    category: 'BAN_TRU',
  },
  {
    id: 10,
    question: 'Khi báo một học sinh vắng mặt, GVCN cần chọn những loại phân loại lý do nào sau đây?',
    options: [
      'Chỉ cần chọn Vắng mặt chung chung',
      'Bắt buộc chọn cụ thể: Ốm đau / Sức khỏe (Có phép), Việc gia đình (Có phép), Nghỉ không phép, hoặc Nghi bỏ học / Vắng nhiều ngày',
      'Tùy ý viết một chữ cái bất kỳ',
      'Không cần chọn lý do nếu học sinh là nam',
    ],
    correctIndex: 1,
    explanation: 'Hệ thống yêu cầu phân loại rõ: Ốm đau, Có phép việc gia đình, Không phép, hoặc Nghi bỏ học để phục vụ công tác theo dõi y tế và duy trì sĩ số phổ cập giáo dục của nhà trường.',
    category: 'NGHIEP_VU_GVCN',
  },
];

class TrainingService {
  /**
   * Kiểm tra Chế độ Tập huấn có đang bật không
   */
  public isTrainingMode(): boolean {
    return localStorage.getItem(TRAINING_STORAGE_KEYS.TRAINING_MODE) === 'true';
  }

  /**
   * Bật / Tắt Chế độ Tập huấn
   */
  public setTrainingMode(enabled: boolean): void {
    localStorage.setItem(TRAINING_STORAGE_KEYS.TRAINING_MODE, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('thcs_banbo_training_mode_changed', { detail: { enabled } }));
  }

  /**
   * Lấy danh sách báo cáo tập huấn (cô lập an toàn)
   */
  public getTrainingReports(): AttendanceReport[] {
    try {
      const raw = localStorage.getItem(TRAINING_STORAGE_KEYS.TRAINING_REPORTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Lưu báo cáo vào kho dữ liệu tập huấn
   */
  public saveTrainingReport(report: AttendanceReport): void {
    const list = this.getTrainingReports();
    const idx = list.findIndex(r => r.id === report.id || (r.date === report.date && r.classId === report.classId && r.session === report.session));
    if (idx >= 0) {
      list[idx] = report;
    } else {
      list.push(report);
    }
    localStorage.setItem(TRAINING_STORAGE_KEYS.TRAINING_REPORTS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('thcs_banbo_training_reports_changed'));
  }

  /**
   * Đặt lại toàn bộ dữ liệu tập huấn về ban đầu
   */
  public resetTrainingData(): void {
    localStorage.removeItem(TRAINING_STORAGE_KEYS.TRAINING_REPORTS);
    localStorage.removeItem(TRAINING_STORAGE_KEYS.ACTIVE_SCENARIO);
    window.dispatchEvent(new CustomEvent('thcs_banbo_training_reports_changed'));
  }

  /**
   * Lấy kết quả trắc nghiệm đã lưu
   */
  public getQuizResult(): { score: number; total: number; passed: boolean; completedAt: string; answers: Record<number, number> } | null {
    try {
      const raw = localStorage.getItem(TRAINING_STORAGE_KEYS.QUIZ_RESULTS);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Lưu kết quả trắc nghiệm
   */
  public saveQuizResult(score: number, total: number, answers: Record<number, number>): void {
    const result = {
      score,
      total,
      passed: score >= 8, // Đạt từ 8/10 câu (80%)
      completedAt: new Date().toISOString(),
      answers,
    };
    localStorage.setItem(TRAINING_STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(result));
  }
}

export const trainingService = new TrainingService();
