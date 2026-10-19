import { storageService } from './storageService';

class PrintService {
  /**
   * Trigger standard browser print with audit logging
   */
  public triggerPrint(documentTitle?: string, userName: string = 'Phạm Ngọc Thúy') {
    if (documentTitle) {
      const prevTitle = document.title;
      document.title = documentTitle;
      window.print();
      setTimeout(() => {
        document.title = prevTitle;
      }, 1000);
    } else {
      window.print();
    }

    storageService.addAuditLog(
      userName,
      `In tài liệu A4: "${documentTitle || 'Báo cáo sĩ số'}"`,
      'report',
      'PRINT_REPORT'
    );
  }
}

export const printService = new PrintService();
