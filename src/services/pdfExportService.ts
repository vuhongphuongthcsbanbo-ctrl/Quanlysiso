import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { storageService } from './storageService';

export interface SignatureConfig {
  showSignatureSection: boolean;
  preparerTitle: string;
  preparerName: string;
  adminTitle: string;
  adminName: string;
  principalTitle: string;
  principalName: string;
}

export const DEFAULT_SIGNATURE_CONFIG: SignatureConfig = {
  showSignatureSection: true,
  preparerTitle: 'NGƯỜI LẬP BÁO CÁO',
  preparerName: 'Phạm Ngọc Thúy',
  adminTitle: 'TỔNG PHỤ TRÁCH ĐỘI',
  adminName: 'Phạm Ngọc Thúy',
  principalTitle: 'HIỆU TRƯỞNG',
  principalName: 'Hoàng Xuân Nhật',
};

class PdfExportService {
  /**
   * Export an HTML element into a multi-page A4 PDF with perfect Vietnamese font rendering
   */
  public async exportElementToPdf(
    element: HTMLElement,
    filename: string,
    orientation: 'p' | 'portrait' | 'l' | 'landscape' = 'portrait',
    userName: string = 'Phạm Ngọc Thúy'
  ): Promise<boolean> {
    try {
      // 1. Render element to high-res canvas (scale 2.0 ensures crisp text and lines)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
      });

      // 2. Setup jsPDF A4 dimensions
      const isLandscape = orientation === 'l' || orientation === 'landscape';
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = isLandscape ? 297 : 210;
      const pdfHeight = isLandscape ? 210 : 297;
      const margin = 10;
      const printableWidth = pdfWidth - margin * 2;
      const printableHeight = pdfHeight - margin * 2;

      const imgWidth = printableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // 3. Add first page
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= printableHeight;

      // 4. If height exceeds one page, split into multiple pages cleanly
      while (heightLeft > 0) {
        position -= printableHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= printableHeight;
      }

      // 5. Save file
      const cleanFileName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      pdf.save(cleanFileName);

      // 6. Audit log
      storageService.addAuditLog(
        userName,
        `Xuất file PDF báo cáo "${cleanFileName}"`,
        'report',
        'EXPORT_SCHOOL_REPORT'
      );

      return true;
    } catch (err) {
      console.error('PDF export failed:', err);
      return false;
    }
  }
}

export const pdfExportService = new PdfExportService();
