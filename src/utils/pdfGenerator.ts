import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Order } from '../types';

export const generatePDF = async (orders: Order[], title: string, agencyName: string) => {
  const pdf = new jsPDF();
  
  // Header
  pdf.setFontSize(20);
  pdf.text(title, 20, 30);
  pdf.setFontSize(12);
  pdf.text(`Agency: ${agencyName}`, 20, 45);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55);
  
  // Summary
  const totalRevenue = orders
    .filter(order => order.status === 'Success')
    .reduce((sum, order) => sum + order.totalAmount, 0);
  
  pdf.setFontSize(14);
  pdf.text(`Total Revenue: Rp ${totalRevenue.toLocaleString()}`, 20, 75);
  pdf.text(`Total Orders: ${orders.length}`, 20, 85);
  pdf.text(`Completed Orders: ${orders.filter(o => o.status === 'Success').length}`, 20, 95);
  
  // Table header
  let yPosition = 115;
  pdf.setFontSize(10);
  pdf.text('Order ID', 20, yPosition);
  pdf.text('Date', 45, yPosition);
  pdf.text('Customer', 75, yPosition);
  pdf.text('Type', 115, yPosition);
  pdf.text('Amount', 145, yPosition);
  pdf.text('Status', 170, yPosition);
  pdf.text('Validation', 190, yPosition);
  
  // Table data
  orders.forEach((order, index) => {
    yPosition += 10;
    if (yPosition > 280) {
      pdf.addPage();
      yPosition = 30;
    }
    
    pdf.text(`#${order.orderId}`, 20, yPosition);
    pdf.text(new Date(order.orderDate).toLocaleDateString(), 45, yPosition);
    pdf.text(order.customerName.substring(0, 12), 75, yPosition);
    pdf.text(order.orderType.substring(0, 12), 115, yPosition);
    pdf.text(`Rp ${order.totalAmount.toLocaleString()}`, 145, yPosition);
    pdf.text(order.status, 170, yPosition);
    pdf.text(order.validationStatus, 190, yPosition);
  });
  
  return pdf;
};