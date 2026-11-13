import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { ExamDocument } from '../types';
import { buildExamAnswerKey } from '../utils/tutorLogic';

function stripLatexMarkers(text: string): string {
  return text
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\ge/g, '≥')
    .replace(/\\le/g, '≤')
    .replace(/\\ne/g, '≠')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\Leftrightarrow/g, '⇔')
    .replace(/\\Rightarrow/g, '⇒')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\in/g, '∈')
    .replace(/\\mathbb\{Z\}/g, 'Z');
}

export async function exportExamToDocx(exam: ExamDocument): Promise<void> {
  const { header, questions } = exam;
  const answerKey = buildExamAnswerKey(questions);
  const letters = ['A', 'B', 'C', 'D'];

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '1E293B' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: header.departmentName, size: 20 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: header.schoolName, bold: true, size: 22 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Năm học: ${header.academicYear}`,
                    italics: true,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: header.examTitle, bold: true, size: 22 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Môn: ${header.subject} · ${header.grade} · Mã đề: ${header.examCode}`,
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Thời gian làm bài: ${header.durationMinutes} phút (không kể thời gian phát đề)`,
                    italics: true,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const questionParagraphs: Paragraph[] = [];

  questions.forEach((q, idx) => {
    questionParagraphs.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({
            text: `Câu ${idx + 1} (${q.totalPoints} điểm · ${q.cognitiveLevel}): `,
            bold: true,
            size: 22,
          }),
          new TextRun({
            text: stripLatexMarkers(q.prompt),
            size: 22,
          }),
        ],
      })
    );

    if (q.type === 'multiple_choice' && q.options) {
      q.options.forEach((opt, optIdx) => {
        questionParagraphs.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `${letters[optIdx] || ''}. ${stripLatexMarkers(opt)}`,
                size: 22,
              }),
            ],
          })
        );
      });
    }

    if (q.type === 'true_false' && q.statements) {
      q.statements.forEach((st) => {
        questionParagraphs.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `${st.label}) ${stripLatexMarkers(st.text)}`,
                size: 22,
              }),
            ],
          })
        );
      });
    }
  });

  const answerSectionParagraphs: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      pageBreakBefore: true,
      spacing: { before: 120, after: 160 },
      children: [
        new TextRun({
          text: `ĐÁP ÁN & BAREM CHẤM ĐIỂM CHI TIẾT (Tổng: ${answerKey.totalPoints} điểm)`,
          bold: true,
          size: 24,
        }),
      ],
    }),
  ];

  answerKey.entries.forEach((entry) => {
    answerSectionParagraphs.push(
      new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({
            text: `Câu ${entry.questionNumber} (${entry.typeLabel} · ${entry.points}đ): `,
            bold: true,
            size: 21,
          }),
          new TextRun({
            text: stripLatexMarkers(entry.answerSummary),
            size: 21,
          }),
        ],
      })
    );
    entry.rubricSteps.forEach((step) => {
      answerSectionParagraphs.push(
        new Paragraph({
          indent: { left: 320 },
          children: [
            new TextRun({
              text: `• ${stripLatexMarkers(step.step)} (+${step.points}đ)`,
              size: 20,
            }),
          ],
        })
      );
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 850, bottom: 850, left: 1000, right: 850 },
          },
        },
        children: [
          headerTable,
          new Paragraph({
            spacing: { before: 180, after: 180 },
            children: [
              new TextRun({
                text: 'Họ và tên thí sinh: ....................................................   Lớp: ............   SBD: ............',
                size: 21,
              }),
            ],
          }),
          ...questionParagraphs,
          ...answerSectionParagraphs,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `De_thi_${header.subject.replace(/\s+/g, '_')}_Ma_${header.examCode}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
