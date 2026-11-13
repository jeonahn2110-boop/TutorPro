import React, { useMemo, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Download,
  Edit3,
  FilePlus2,
  Loader2,
  Printer,
  RefreshCw,
  Trash2,
  Wand2,
} from 'lucide-react';
import type {
  ExamDocument,
  ExamQuestion,
  QuestionType,
} from '../types';
import { buildExamAnswerKey } from '../utils/tutorLogic';
import { exportExamToDocx } from '../services/docxExporter';
import { MathRenderer } from './MathRenderer';

interface ExamBuilderViewProps {
  exam: ExamDocument;
  onChangeExam: (next: ExamDocument) => void;
}

type StudioToolTab = 'generate' | 'modify' | 'ocr' | 'header';

const LETTERS = ['A', 'B', 'C', 'D'];

export const ExamBuilderView: React.FC<ExamBuilderViewProps> = ({
  exam,
  onChangeExam,
}) => {
  const [activeTool, setActiveTool] = useState<StudioToolTab>('generate');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    exam.questions[0]?.id || ''
  );
  const [showAnswerPage, setShowAnswerPage] = useState(true);

  // AI Generate Form State
  const [genSubject, setGenSubject] = useState(exam.header.subject);
  const [genGrade, setGenGrade] = useState(exam.header.grade);
  const [genTopic, setGenTopic] = useState(
    'Phương trình bậc hai, Hệ thức Vi-ét và Ứng dụng thực tế'
  );
  const [genMcCount, setGenMcCount] = useState(3);
  const [genTfCount, setGenTfCount] = useState(1);
  const [genSaCount, setGenSaCount] = useState(1);
  const [genEssayCount, setGenEssayCount] = useState(1);
  const [genDifficulty, setGenDifficulty] = useState(
    'Tổng hợp (Nhận biết - Thông hiểu - Vận dụng)'
  );
  const [isGenerating, setIsGenerating] = useState(false);

  // AI Modify Single Question State
  const [modifyInstruction, setModifyInstruction] = useState(
    'Đổi số liệu câu này sang dạng tương tự nhưng giữ nguyên cấu trúc'
  );
  const [isModifying, setIsModifying] = useState(false);

  // OCR Image State
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const ocrInputRef = useRef<HTMLInputElement>(null);

  // Feedback / Error Banner
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const selectedQuestion = useMemo(
    () => exam.questions.find((q) => q.id === selectedQuestionId) || null,
    [exam.questions, selectedQuestionId]
  );

  const answerKey = useMemo(
    () => buildExamAnswerKey(exam.questions),
    [exam.questions]
  );

  const handleGenerateExamAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setStatusMessage(null);
    try {
      const resp = await fetch('/api/ai/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: genSubject,
          grade: genGrade,
          topic: genTopic,
          multipleChoiceCount: genMcCount,
          trueFalseCount: genTfCount,
          shortAnswerCount: genSaCount,
          essayCount: genEssayCount,
          difficulty: genDifficulty,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Không thể sinh đề thi từ AI.',
        });
        return;
      }

      const incomingQuestions: ExamQuestion[] = (data.questions || []).map(
        (q: Partial<ExamQuestion>, idx: number) => ({
          id: `q-ai-${Date.now()}-${idx}`,
          type: (q.type as QuestionType) || 'multiple_choice',
          cognitiveLevel:
            (q.cognitiveLevel as ExamQuestion['cognitiveLevel']) || 'Thông hiểu',
          prompt: q.prompt || '',
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          statements: q.statements,
          shortAnswer: q.shortAnswer,
          rubricSteps: q.rubricSteps || [],
          totalPoints: typeof q.totalPoints === 'number' ? q.totalPoints : 1,
        })
      );

      if (incomingQuestions.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'AI không trả về câu hỏi nào. Vui lòng thử lại với mô tả chi tiết hơn.',
        });
        return;
      }

      onChangeExam({
        ...exam,
        updatedAt: 'Vừa cập nhật bằng AI',
        header: {
          ...exam.header,
          subject: genSubject,
          grade: genGrade,
          examTitle: data.examTitle || exam.header.examTitle,
        },
        questions: incomingQuestions,
      });
      setSelectedQuestionId(incomingQuestions[0].id);
      setStatusMessage({
        type: 'success',
        text: `Đã tạo thành công ${incomingQuestions.length} câu hỏi chuẩn A4 kèm bảng đáp án & barem.`,
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text:
          err instanceof Error ? err.message : 'Lỗi kết nối máy chủ tạo đề AI.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleModifyQuestionAI = async (customPrompt?: string) => {
    if (!selectedQuestion) return;
    const instruction = (customPrompt || modifyInstruction).trim();
    if (!instruction) return;

    setIsModifying(true);
    setStatusMessage(null);
    try {
      const resp = await fetch('/api/ai/modify-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: selectedQuestion,
          instruction,
          subject: exam.header.subject,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Không thể chỉnh sửa câu hỏi bằng AI.',
        });
        return;
      }

      onChangeExam({
        ...exam,
        updatedAt: 'Vừa chỉnh sửa câu hỏi',
        questions: exam.questions.map((q) =>
          q.id === selectedQuestion.id ? { ...q, ...data, id: q.id } : q
        ),
      });
      setStatusMessage({
        type: 'success',
        text: 'Đã cập nhật số liệu & barem của câu hỏi đã chọn.',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi kết nối AI.',
      });
    } finally {
      setIsModifying(false);
    }
  };

  const handleOcrFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      setOcrPreviewUrl(dataUrl);
      setIsOcrRunning(true);
      setStatusMessage(null);

      try {
        const resp = await fetch('/api/ai/ocr-exam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: dataUrl,
            mimeType: file.type || 'image/png',
          }),
        });
        const data = await resp.json();
        if (!resp.ok) {
          setStatusMessage({
            type: 'error',
            text: data.error || 'Không thể nhận diện OCR từ ảnh.',
          });
          return;
        }

        const detectedQuestions: ExamQuestion[] = (data.questions || []).map(
          (q: Partial<ExamQuestion>, idx: number) => ({
            id: `q-ocr-${Date.now()}-${idx}`,
            type: (q.type as QuestionType) || 'essay',
            cognitiveLevel:
              (q.cognitiveLevel as ExamQuestion['cognitiveLevel']) ||
              'Thông hiểu',
            prompt: q.prompt || '',
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            statements: q.statements,
            shortAnswer: q.shortAnswer,
            rubricSteps: q.rubricSteps || [],
            totalPoints: typeof q.totalPoints === 'number' ? q.totalPoints : 1,
          })
        );

        if (detectedQuestions.length > 0) {
          onChangeExam({
            ...exam,
            updatedAt: 'Vừa nhập từ OCR AI',
            questions: [...exam.questions, ...detectedQuestions],
          });
          setSelectedQuestionId(detectedQuestions[0].id);
          setStatusMessage({
            type: 'success',
            text: `OCR AI đã nhận diện và chèn thêm ${detectedQuestions.length} câu hỏi vào đề thi.`,
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: 'Không tìm thấy câu hỏi rõ ràng trong ảnh tải lên.',
          });
        }
      } catch (err) {
        setStatusMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Lỗi kết nối OCR AI.',
        });
      } finally {
        setIsOcrRunning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddBlankQuestion = (type: QuestionType) => {
    const newQ: ExamQuestion = {
      id: `q-man-${Date.now()}`,
      type,
      cognitiveLevel: 'Thông hiểu',
      prompt:
        type === 'multiple_choice'
          ? 'Tính giá trị biểu thức $P = \\sqrt{9} + 2^3$.'
          : type === 'true_false'
            ? 'Xét tính đúng sai của các mệnh đề sau về hàm số $y = 2x - 4$:'
            : type === 'short_answer'
              ? 'Tìm nghiệm dương của phương trình $x^2 - 9 = 0$.'
              : 'Giải hệ phương trình $\\begin{cases} x + y = 5 \\\\ 2x - y = 1 \\end{cases}$.',
      options:
        type === 'multiple_choice'
          ? ['$9$', '$11$', '$13$', '$7$']
          : undefined,
      correctOptionIndex: type === 'multiple_choice' ? 1 : undefined,
      statements:
        type === 'true_false'
          ? [
              { label: 'a', text: 'Đồ thị cắt trục tung tại điểm $(0; -4)$.', isTrue: true },
              { label: 'b', text: 'Hàm số nghịch biến trên $\\mathbb{R}$.', isTrue: false },
              { label: 'c', text: 'Đồ thị đi qua điểm $M(2; 0)$.', isTrue: true },
              { label: 'd', text: 'Hệ số góc của đường thẳng là $-4$.', isTrue: false },
            ]
          : undefined,
      shortAnswer:
        type === 'short_answer'
          ? '$x = 3$'
          : type === 'essay'
            ? '$(x; y) = (2; 3)$'
            : undefined,
      totalPoints: type === 'essay' ? 2 : 1,
      rubricSteps: [
        { step: 'Trình bày chính xác các bước biến đổi và kết luận.', points: type === 'essay' ? 2 : 1 },
      ],
    };

    onChangeExam({
      ...exam,
      questions: [...exam.questions, newQ],
    });
    setSelectedQuestionId(newQ.id);
    setActiveTool('modify');
  };

  const handleDeleteQuestion = (id: string) => {
    const remaining = exam.questions.filter((q) => q.id !== id);
    onChangeExam({ ...exam, questions: remaining });
    if (selectedQuestionId === id) {
      setSelectedQuestionId(remaining[0]?.id || '');
    }
  };

  const updateSelectedQuestionField = (patch: Partial<ExamQuestion>) => {
    if (!selectedQuestion) return;
    onChangeExam({
      ...exam,
      questions: exam.questions.map((q) =>
        q.id === selectedQuestion.id ? { ...q, ...patch } : q
      ),
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Action Toolbar (Hidden when printing A4) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Trình soạn đề thi AI chuẩn A4
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {exam.questions.length} câu hỏi · Tổng {answerKey.totalPoints} điểm · Hỗ trợ công thức KaTeX, OCR ảnh &amp; xuất Word
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={showAnswerPage}
              onChange={(e) => setShowAnswerPage(e.target.checked)}
              className="rounded border-slate-300 text-blue-600"
            />
            Hiện trang Đáp án &amp; Barem
          </label>

          <button
            type="button"
            onClick={() => exportExamToDocx(exam)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            Xuất Word (.docx)
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            In / Lưu PDF chuẩn A4
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`rounded-xl px-4 py-3 text-xs font-medium border no-print ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Split Studio Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left AI & Question Editor Controls (Hidden on Print) */}
        <aside className="xl:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden no-print xl:sticky xl:top-4">
          <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 text-[11px] font-semibold">
            {(
              [
                ['generate', 'Tạo đề AI', Wand2],
                ['modify', 'Sửa câu hỏi', Edit3],
                ['ocr', 'OCR Ảnh', Camera],
                ['header', 'Tiêu đề A4', FilePlus2],
              ] as [StudioToolTab, string, React.ElementType][]
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTool(key)}
                className={`py-3 px-2 flex flex-col items-center gap-1 border-b-2 transition-colors ${
                  activeTool === key
                    ? 'border-blue-600 text-blue-700 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>

          <div className="p-5 space-y-4">
            {/* TAB 1: AI EXAM GENERATOR */}
            {activeTool === 'generate' && (
              <form onSubmit={handleGenerateExamAI} className="space-y-3.5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Sinh đề thi hoàn chỉnh bằng Gemini AI
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tự động soạn câu hỏi kèm công thức KaTeX và barem chấm điểm
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="ai-subject"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Môn học
                    </label>
                    <input
                      id="ai-subject"
                      type="text"
                      value={genSubject}
                      onChange={(e) => setGenSubject(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="ai-grade"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Khối lớp
                    </label>
                    <input
                      id="ai-grade"
                      type="text"
                      value={genGrade}
                      onChange={(e) => setGenGrade(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="ai-topic"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Chương / Chủ đề trọng tâm
                  </label>
                  <textarea
                    id="ai-topic"
                    rows={2}
                    value={genTopic}
                    onChange={(e) => setGenTopic(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="cnt-mc"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Trắc nghiệm
                    </label>
                    <input
                      id="cnt-mc"
                      type="number"
                      min={0}
                      max={20}
                      value={genMcCount}
                      onChange={(e) => setGenMcCount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono-num border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="cnt-tf"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Đúng / Sai
                    </label>
                    <input
                      id="cnt-tf"
                      type="number"
                      min={0}
                      max={10}
                      value={genTfCount}
                      onChange={(e) => setGenTfCount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono-num border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="cnt-sa"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Trả lời ngắn
                    </label>
                    <input
                      id="cnt-sa"
                      type="number"
                      min={0}
                      max={10}
                      value={genSaCount}
                      onChange={(e) => setGenSaCount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono-num border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="cnt-es"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Tự luận
                    </label>
                    <input
                      id="cnt-es"
                      type="number"
                      min={0}
                      max={10}
                      value={genEssayCount}
                      onChange={(e) => setGenEssayCount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono-num border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="ai-diff"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Mức độ nhận thức
                  </label>
                  <select
                    id="ai-diff"
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option>Cơ bản (Nhận biết - Thông hiểu)</option>
                    <option>Tổng hợp (Nhận biết - Thông hiểu - Vận dụng)</option>
                    <option>Nâng cao (Vận dụng - Vận dụng cao)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tạo đề chuẩn A4...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Tạo đề thi bằng AI
                    </>
                  )}
                </button>

                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-500 mb-2">
                    Hoặc thêm nhanh câu hỏi thủ công:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddBlankQuestion('multiple_choice')}
                      className="px-2 py-1.5 text-[11px] font-medium border border-slate-200 rounded hover:bg-slate-50 text-slate-700"
                    >
                      + Trắc nghiệm
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlankQuestion('true_false')}
                      className="px-2 py-1.5 text-[11px] font-medium border border-slate-200 rounded hover:bg-slate-50 text-slate-700"
                    >
                      + Đúng / Sai
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlankQuestion('short_answer')}
                      className="px-2 py-1.5 text-[11px] font-medium border border-slate-200 rounded hover:bg-slate-50 text-slate-700"
                    >
                      + Trả lời ngắn
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlankQuestion('essay')}
                      className="px-2 py-1.5 text-[11px] font-medium border border-slate-200 rounded hover:bg-slate-50 text-slate-700"
                    >
                      + Tự luận
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: AI QUESTION VARIATION & DIRECT EDIT */}
            {activeTool === 'modify' && (
              <div className="space-y-4">
                {!selectedQuestion ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Nhấp chọn một câu hỏi trên trang giấy A4 bên phải để chỉnh sửa hoặc đổi số liệu bằng AI.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-700">
                        Đang chọn Câu{' '}
                        {exam.questions.findIndex(
                          (q) => q.id === selectedQuestion.id
                        ) + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(selectedQuestion.id)}
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa câu
                      </button>
                    </div>

                    {/* AI Modify Block */}
                    <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 space-y-2.5">
                      <p className="text-xs font-semibold text-blue-950">
                        Chỉnh số liệu bằng AI
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Đổi số liệu sang dạng tương tự',
                          'Tăng độ khó câu này',
                          'Rút gọn câu hỏi dễ hiểu hơn',
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setModifyInstruction(preset);
                              handleModifyQuestionAI(preset);
                            }}
                            className="px-2 py-1 text-[11px] bg-white border border-blue-200 text-blue-800 rounded hover:bg-blue-100"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={2}
                        value={modifyInstruction}
                        onChange={(e) => setModifyInstruction(e.target.value)}
                        aria-label="Lệnh chỉnh sửa câu hỏi bằng AI"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-200 rounded-lg"
                      />
                      <button
                        type="button"
                        disabled={isModifying}
                        onClick={() => handleModifyQuestionAI()}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                      >
                        {isModifying ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        {isModifying ? 'AI đang cập nhật...' : 'Chỉnh câu này bằng AI'}
                      </button>
                    </div>

                    {/* Direct Manual Edit */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <label className="block text-xs font-medium text-slate-700">
                        Nội dung câu hỏi (LaTeX $...$)
                        <textarea
                          rows={4}
                          value={selectedQuestion.prompt}
                          onChange={(e) =>
                            updateSelectedQuestionField({ prompt: e.target.value })
                          }
                          className="mt-1 w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono-num"
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <label className="block text-xs font-medium text-slate-700">
                          Điểm số
                          <input
                            type="number"
                            step={0.25}
                            min={0.25}
                            value={selectedQuestion.totalPoints}
                            onChange={(e) =>
                              updateSelectedQuestionField({
                                totalPoints: Number(e.target.value) || 0.5,
                              })
                            }
                            className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono-num border border-slate-200 rounded-lg"
                          />
                        </label>
                        <label className="block text-xs font-medium text-slate-700">
                          Mức độ
                          <select
                            value={selectedQuestion.cognitiveLevel}
                            onChange={(e) =>
                              updateSelectedQuestionField({
                                cognitiveLevel: e.target
                                  .value as ExamQuestion['cognitiveLevel'],
                              })
                            }
                            className="mt-1 w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          >
                            <option value="Nhận biết">Nhận biết</option>
                            <option value="Thông hiểu">Thông hiểu</option>
                            <option value="Vận dụng">Vận dụng</option>
                            <option value="Vận dụng cao">Vận dụng cao</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 3: OCR IMAGE TO EXAM */}
            {activeTool === 'ocr' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Chuyển ảnh đề thi thành văn bản (OCR AI)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tải lên ảnh chụp đề thi giấy, Gemini Vision sẽ nhận diện chữ viết và công thức toán học thành LaTeX để sửa trực tiếp.
                  </p>
                </div>

                <input
                  ref={ocrInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleOcrFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={isOcrRunning}
                  onClick={() => ocrInputRef.current?.click()}
                  className="w-full py-8 px-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50/40 transition-colors flex flex-col items-center gap-2 text-center"
                >
                  {isOcrRunning ? (
                    <>
                      <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                      <span className="text-xs font-semibold text-blue-700">
                        Đang bóc tách công thức &amp; chữ viết bằng OCR AI...
                      </span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-7 h-7 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-800">
                        Chọn ảnh đề thi giấy (PNG, JPG)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Tự động chèn câu hỏi đã nhận diện vào đề thi
                      </span>
                    </>
                  )}
                </button>

                {ocrPreviewUrl && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <img
                      src={ocrPreviewUrl}
                      alt="Ảnh đề thi vừa tải lên"
                      className="w-full max-h-48 object-contain bg-slate-50"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: EXAM HEADER META */}
            {activeTool === 'header' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Thông tin đầu trang chuẩn đề thi
                </h3>
                {(
                  [
                    ['departmentName', 'Đơn vị chủ quản'],
                    ['schoolName', 'Tên trường / Lớp'],
                    ['examTitle', 'Tên kỳ kiểm tra'],
                    ['subject', 'Môn học'],
                    ['grade', 'Khối lớp'],
                    ['examCode', 'Mã đề'],
                    ['academicYear', 'Năm học'],
                  ] as [keyof ExamDocument['header'], string][]
                ).map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={String(exam.header[field])}
                      onChange={(e) =>
                        onChangeExam({
                          ...exam,
                          header: { ...exam.header, [field]: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Thời gian làm bài (phút)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={exam.header.durationMinutes}
                    onChange={(e) =>
                      onChangeExam({
                        ...exam,
                        header: {
                          ...exam.header,
                          durationMinutes: Number(e.target.value) || 45,
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono-num border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Right: A4 Paginated Print-Standard Paper Canvas */}
        <section className="xl:col-span-8 bg-slate-200/75 border border-slate-200 rounded-xl p-3 sm:p-6 overflow-x-auto print-only-container">
          <div className="mx-auto space-y-6 max-w-[794px]">
            {/* PAGE 1: EXAM QUESTIONS A4 SHEET */}
            <div className="a4-sheet bg-white shadow-sm border border-slate-300/80 px-6 py-8 sm:px-12 sm:py-11 min-h-[1040px] font-exam text-slate-900">
              {/* Standard Vietnamese Exam Header */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pb-4 border-b-2 border-slate-900 text-center">
                <div className="sm:col-span-5 space-y-0.5">
                  <p className="text-[11px] uppercase tracking-wide">
                    {exam.header.departmentName}
                  </p>
                  <p className="text-xs font-bold uppercase">
                    {exam.header.schoolName}
                  </p>
                  <p className="text-[11px] italic text-slate-600">
                    Năm học: {exam.header.academicYear}
                  </p>
                </div>
                <div className="sm:col-span-7 space-y-0.5">
                  <p className="text-xs sm:text-sm font-bold uppercase">
                    {exam.header.examTitle}
                  </p>
                  <p className="text-xs font-semibold">
                    Môn: {exam.header.subject} ({exam.header.grade}) · Mã đề:{' '}
                    <span className="font-mono-num border border-slate-900 px-1.5 py-0.5">
                      {exam.header.examCode}
                    </span>
                  </p>
                  <p className="text-[11px] italic text-slate-600">
                    Thời gian làm bài: {exam.header.durationMinutes} phút (không kể thời gian phát đề)
                  </p>
                </div>
              </div>

              {/* Candidate Box */}
              <div className="mt-4 mb-6 border border-slate-800 grid grid-cols-12 text-xs">
                <div className="col-span-8 p-2.5 border-r border-slate-800 space-y-1.5">
                  <p>
                    Họ và tên thí sinh: .......................................................................
                  </p>
                  <p>
                    Lớp: .............................. Số báo danh: ..................................
                  </p>
                </div>
                <div className="col-span-4 p-2.5 text-center flex flex-col justify-between">
                  <p className="font-bold uppercase text-[11px]">Điểm số</p>
                  <p className="text-slate-400 text-[11px]">........ / {answerKey.totalPoints}</p>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-5 text-[14px] leading-relaxed">
                {exam.questions.map((q, idx) => {
                  const isSelected = q.id === selectedQuestionId;
                  return (
                    <div
                      key={q.id}
                      onClick={() => {
                        setSelectedQuestionId(q.id);
                        setActiveTool('modify');
                      }}
                      className={`group relative rounded-lg p-2.5 -mx-2.5 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 ring-1 ring-blue-300'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <span className="font-bold mr-1.5">
                            Câu {idx + 1} ({q.totalPoints} điểm):
                          </span>
                          <MathRenderer text={q.prompt} />
                        </div>
                        <span className="text-[11px] font-sans text-slate-500 shrink-0 no-print">
                          {q.cognitiveLevel}
                        </span>
                      </div>

                      {/* Multiple Choice Options */}
                      {q.type === 'multiple_choice' && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-2 pl-4">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-start gap-1.5">
                              <span className="font-semibold">
                                {LETTERS[optIdx]}.
                              </span>
                              <MathRenderer text={opt} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* True / False Statements */}
                      {q.type === 'true_false' && q.statements && (
                        <div className="mt-2 pl-4 space-y-1">
                          {q.statements.map((st) => (
                            <div key={st.label} className="flex items-start gap-2">
                              <span className="font-semibold">{st.label})</span>
                              <MathRenderer text={st.text} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Short Answer Blank Box */}
                      {q.type === 'short_answer' && (
                        <div className="mt-2 pl-4 text-xs text-slate-600 font-sans">
                          Đáp án ngắn: ............................................................
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 pt-4 border-t border-slate-200 text-center text-xs italic text-slate-500">
                --- HẾT (Thí sinh không được sử dụng tài liệu khi làm bài) ---
              </div>
            </div>

            {/* PAGE 2: AUTO-GENERATED ANSWER KEY & GRADING RUBRIC */}
            {showAnswerPage && (
              <div className="a4-sheet bg-white shadow-sm border border-slate-300/80 px-6 py-8 sm:px-12 sm:py-11 font-exam text-slate-900">
                <div className="pb-3 border-b-2 border-slate-900 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase">
                      HƯỚNG DẪN CHẤM &amp; BAREM ĐIỂM CHI TIẾT
                    </h3>
                    <p className="text-xs text-slate-600">
                      {exam.header.examTitle} · Mã đề {exam.header.examCode}
                    </p>
                  </div>
                  <span className="text-xs font-bold font-mono-num">
                    Tổng điểm: {answerKey.totalPoints}
                  </span>
                </div>

                {/* Quick Answer Summary Table */}
                <table className="w-full mt-4 border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-400 py-1.5 px-2.5 text-left">
                        Câu
                      </th>
                      <th className="border border-slate-400 py-1.5 px-2.5 text-left">
                        Dạng câu hỏi
                      </th>
                      <th className="border border-slate-400 py-1.5 px-2.5 text-left">
                        Đáp án chuẩn
                      </th>
                      <th className="border border-slate-400 py-1.5 px-2.5 text-right">
                        Điểm
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {answerKey.entries.map((entry) => (
                      <tr key={entry.questionNumber}>
                        <td className="border border-slate-400 py-1.5 px-2.5 font-bold font-mono-num">
                          Câu {entry.questionNumber}
                        </td>
                        <td className="border border-slate-400 py-1.5 px-2.5">
                          {entry.typeLabel}
                        </td>
                        <td className="border border-slate-400 py-1.5 px-2.5">
                          <MathRenderer text={entry.answerSummary} />
                        </td>
                        <td className="border border-slate-400 py-1.5 px-2.5 text-right font-mono-num">
                          {entry.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Step-by-Step Rubric */}
                <div className="mt-6 space-y-4 text-xs">
                  <h4 className="font-bold uppercase text-slate-800">
                    Barem chấm điểm chi tiết từng ý
                  </h4>
                  {answerKey.entries.map((entry) => (
                    <div
                      key={entry.questionNumber}
                      className="border-b border-slate-200 pb-3 last:border-b-0"
                    >
                      <p className="font-bold text-slate-900">
                        Câu {entry.questionNumber} ({entry.points} điểm):
                      </p>
                      <ul className="mt-1 space-y-1 pl-4">
                        {entry.rubricSteps.map((st, sIdx) => (
                          <li
                            key={sIdx}
                            className="flex items-start justify-between gap-4"
                          >
                            <span className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 mt-0.5 shrink-0" />
                              <MathRenderer text={st.step} />
                            </span>
                            <span className="font-mono-num font-semibold shrink-0">
                              +{st.points}đ
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
