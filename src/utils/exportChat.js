import { jsPDF } from 'jspdf';

export function exportAsTxt(messages) {
  const text = messages.map((message) => `[${message.timestamp}] ${message.role.toUpperCase()}: ${message.content}`).join('\n\n');
  downloadBlob(text, 'nexus-ai-chat.txt', 'text/plain;charset=utf-8');
}

export function exportAsPdf(messages) {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold');
  doc.text('Nexus AI Conversation', 14, 18);
  doc.setFont('helvetica', 'normal');

  let y = 30;
  messages.forEach((message) => {
    const lines = doc.splitTextToSize(`${message.role.toUpperCase()} (${message.timestamp}): ${message.content}`, 180);
    if (y + lines.length * 7 > 280) {
      doc.addPage();
      y = 18;
    }
    doc.text(lines, 14, y);
    y += lines.length * 7 + 5;
  });

  doc.save('nexus-ai-chat.pdf');
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
