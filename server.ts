import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    const hasGeminiKey = Boolean(getGeminiClient());
    res.json({ ok: true, geminiReady: hasGeminiKey });
  });

  // 1. AI Exam Generation Endpoint
  app.post('/api/ai/generate-exam', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        code: 'MISSING_API_KEY',
        error:
          'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng thiết lập biến môi trường GEMINI_API_KEY trong bảng Secrets để sử dụng Gemini AI trực tiếp.',
      });
    }

    try {
      const {
        subject = 'Toán học',
        grade = 'Lớp 9',
        topic = 'Phương trình bậc hai và Hệ thức Vi-ét',
        multipleChoiceCount = 4,
        trueFalseCount = 1,
        shortAnswerCount = 1,
        essayCount = 2,
        difficulty = 'Tổng hợp (Nhận biết - Vận dụng)',
      } = req.body ?? {};

      const prompt = `Bạn là chuyên gia ra đề thi tại Việt Nam. Hãy tạo một đề thi hoàn chỉnh theo đúng chương trình giáo dục phổ thông mới cho:
- Môn học: ${subject}
- Khối lớp: ${grade}
- Chủ đề / Chương: ${topic}
- Mức độ nhận thức: ${difficulty}
- Số lượng câu hỏi chính xác:
  + ${multipleChoiceCount} câu Trắc nghiệm (type: "multiple_choice", có đúng 4 phương án trong options, correctOptionIndex từ 0-3)
  + ${trueFalseCount} câu Đúng/Sai (type: "true_false", có đúng 4 ý a, b, c, d trong statements)
  + ${shortAnswerCount} câu Trả lời ngắn (type: "short_answer", có đáp án ngắn gọn trong shortAnswer)
  + ${essayCount} câu Tự luận (type: "essay", có đáp án tóm tắt và các ý barem chấm điểm chi tiết trong rubricSteps)

QUAN TRỌNG VỀ CÔNG THỨC TOÁN/LÝ/HÓA:
- Mọi công thức toán học, vật lý, hóa học PHẢI bọc trong dấu $...$ (inline) hoặc $$...$$ (block) theo chuẩn LaTeX để render bằng KaTeX. Ví dụ: $\\Delta = b^2 - 4ac$, $\\frac{-b + \\sqrt{\\Delta}}{2a}$, $H_2SO_4$.
- Ngôn ngữ: Tiếng Việt chuẩn mực sư phạm.
- Tổng điểm các câu cộng lại hợp lý (thường 10 điểm).`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Chỉ trả về JSON hợp lệ theo schema được chỉ định. Đảm bảo LaTeX hợp lệ và không thiếu dấu $.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              examTitle: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: {
                      type: Type.STRING,
                      description:
                        'One of: multiple_choice, true_false, short_answer, essay',
                    },
                    cognitiveLevel: {
                      type: Type.STRING,
                      description:
                        'One of: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao',
                    },
                    prompt: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctOptionIndex: { type: Type.INTEGER },
                    statements: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          text: { type: Type.STRING },
                          isTrue: { type: Type.BOOLEAN },
                        },
                      },
                    },
                    shortAnswer: { type: Type.STRING },
                    totalPoints: { type: Type.NUMBER },
                    rubricSteps: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          step: { type: Type.STRING },
                          points: { type: Type.NUMBER },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Lỗi gọi Gemini API';
      console.error('Error /api/ai/generate-exam:', error);
      return res.status(500).json({ error: msg });
    }
  });

  // 2. AI Modify Single Question Endpoint ("Chỉnh số liệu bằng AI")
  app.post('/api/ai/modify-question', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        code: 'MISSING_API_KEY',
        error:
          'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng thiết lập biến môi trường GEMINI_API_KEY trong bảng Secrets.',
      });
    }

    try {
      const { question, instruction, subject = 'Toán học' } = req.body ?? {};
      if (!question || !instruction) {
        return res
          .status(400)
          .json({ error: 'Thiếu dữ liệu câu hỏi hoặc yêu cầu chỉnh sửa.' });
      }

      const prompt = `Bạn là giáo viên chuyên môn ${subject}. Hãy chỉnh sửa DUY NHẤT câu hỏi dưới đây theo yêu cầu của gia sư, giữ nguyên loại câu hỏi (${question.type}), cập nhật lại đáp án và barem chấm điểm cho khớp hoàn toàn với số liệu mới.

Câu hỏi hiện tại (JSON):
${JSON.stringify(question, null, 2)}

Yêu cầu của gia sư: "${instruction}"

Lưu ý:
- Bọc công thức toán/lý/hóa trong $...$ hoặc $$...$$ chuẩn LaTeX.
- Giữ nguyên cấu trúc JSON tương ứng với loại câu hỏi.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cognitiveLevel: { type: Type.STRING },
              prompt: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctOptionIndex: { type: Type.INTEGER },
              statements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    text: { type: Type.STRING },
                    isTrue: { type: Type.BOOLEAN },
                  },
                },
              },
              shortAnswer: { type: Type.STRING },
              totalPoints: { type: Type.NUMBER },
              rubricSteps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.STRING },
                    points: { type: Type.NUMBER },
                  },
                },
              },
            },
          },
        },
      });

      const updated = JSON.parse(response.text || '{}');
      return res.json({
        ...question,
        ...updated,
        id: question.id,
        type: question.type,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Lỗi chỉnh sửa câu hỏi AI';
      console.error('Error /api/ai/modify-question:', error);
      return res.status(500).json({ error: msg });
    }
  });

  // 3. OCR Image to Exam Questions Endpoint ("Chuyển ảnh đề thi thành văn bản")
  app.post('/api/ai/ocr-exam', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        code: 'MISSING_API_KEY',
        error:
          'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng thiết lập biến môi trường GEMINI_API_KEY trong bảng Secrets.',
      });
    }

    try {
      const { imageBase64, mimeType = 'image/png' } = req.body ?? {};
      if (!imageBase64) {
        return res.status(400).json({ error: 'Vui lòng cung cấp ảnh đề thi.' });
      }

      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: `Hãy nhận diện toàn bộ đề thi trong ảnh (OCR) và chuyển thành danh sách câu hỏi có cấu trúc JSON.
- Nhận diện chính xác tiếng Việt và mọi công thức toán học/lý/hóa, chuyển thành LaTeX bọc trong $...$ hoặc $$...$$.
- Phân loại mỗi câu vào: multiple_choice, true_false, short_answer, hoặc essay.
- Tự động giải gợi ý ngắn gọn đáp án và barem điểm cho mỗi câu.`,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedTitle: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    cognitiveLevel: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctOptionIndex: { type: Type.INTEGER },
                    statements: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          text: { type: Type.STRING },
                          isTrue: { type: Type.BOOLEAN },
                        },
                      },
                    },
                    shortAnswer: { type: Type.STRING },
                    totalPoints: { type: Type.NUMBER },
                    rubricSteps: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          step: { type: Type.STRING },
                          points: { type: Type.NUMBER },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Lỗi OCR ảnh đề thi';
      console.error('Error /api/ai/ocr-exam:', error);
      return res.status(500).json({ error: msg });
    }
  });

  // 4. Email Notification Dispatch Endpoint (Webhook / Cloud Function Ready)
  app.post('/api/notifications/send-email', async (req, res) => {
    const { recipients = [], subject, className, postTitle } = req.body ?? {};
    // Trong thực tế triển khai Firebase: kết nối Firebase Trigger Email Extension hoặc Resend/SendGrid SMTP tại đây.
    console.log(
      `[TutorPro Mailer] Dispatching "${subject || postTitle}" (${className}) to:`,
      recipients
    );
    return res.json({
      dispatched: true,
      count: Array.isArray(recipients) ? recipients.length : 0,
      recipients,
      timestamp: new Date().toISOString(),
    });
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TutorPro AI server running at http://localhost:${PORT}`);
  });
}

startServer();
