import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  FileText,
  Film,
  KeyRound,
  Link as LinkIcon,
  Mail,
  Plus,
  Search,
  Send,
  Upload,
  Users,
  X,
} from 'lucide-react';
import type {
  AttachmentItem,
  Classroom,
  ClassroomPost,
  MaterialType,
  StudentRecord,
  StudentSubmission,
  UserRole,
} from '../types';
import { AvatarBadge } from './AvatarBadge';
import { MathRenderer } from './MathRenderer';

interface ClassroomViewProps {
  role: UserRole;
  currentStudentId: string;
  classes: Classroom[];
  students: StudentRecord[];
  posts: ClassroomPost[];
  submissions: StudentSubmission[];
  onCreatePost: (post: ClassroomPost) => Promise<void>;
  onSubmitHomework: (submission: StudentSubmission) => void;
  onGradeSubmission: (submissionId: string, score: number, feedback: string) => void;
  onJoinClassByCode: (code: string) => { ok: boolean; message: string };
}

const MATERIAL_ICONS: Record<MaterialType, React.ReactNode> = {
  pdf: <FileText className="w-4 h-4 text-rose-600 shrink-0" />,
  word: <FileText className="w-4 h-4 text-blue-600 shrink-0" />,
  slide: <FileText className="w-4 h-4 text-amber-600 shrink-0" />,
  video: <Film className="w-4 h-4 text-indigo-600 shrink-0" />,
  link: <LinkIcon className="w-4 h-4 text-slate-600 shrink-0" />,
};

export const ClassroomView: React.FC<ClassroomViewProps> = ({
  role,
  currentStudentId,
  classes,
  students,
  posts,
  submissions,
  onCreatePost,
  onSubmitHomework,
  onGradeSubmission,
  onJoinClassByCode,
}) => {
  const availableClasses = useMemo(() => {
    if (role === 'tutor') return classes;
    return classes.filter((c) => c.studentIds.includes(currentStudentId));
  }, [role, classes, currentStudentId]);

  const [selectedClassId, setSelectedClassId] = useState<string>(
    availableClasses[0]?.id || classes[0]?.id || ''
  );
  const [copiedCode, setCopiedCode] = useState(false);

  // Tutor: Create Post Modal
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postKind, setPostKind] = useState<'lecture' | 'assignment'>('assignment');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postDeadline, setPostDeadline] = useState('2026-11-20T21:00');
  const [postAttachments, setPostAttachments] = useState<AttachmentItem[]>([]);
  const [newAttName, setNewAttName] = useState('');
  const [newAttType, setNewAttType] = useState<MaterialType>('pdf');
  const [newAttUrl, setNewAttUrl] = useState('');
  const [postError, setPostError] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Student: Join Class Modal
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinFeedback, setJoinFeedback] = useState('');

  // Student: Submit Homework Modal
  const [submitTargetPost, setSubmitTargetPost] = useState<ClassroomPost | null>(
    null
  );
  const [submitFileName, setSubmitFileName] = useState('');
  const [submitNote, setSubmitNote] = useState('');
  const [submitFileType, setSubmitFileType] = useState<'image' | 'pdf' | 'doc'>(
    'image'
  );

  // Separate tabs & search for Assignments vs Materials
  const [postTabFilter, setPostTabFilter] = useState<'assignment' | 'lecture'>(
    'assignment'
  );
  const [postSearchQuery, setPostSearchQuery] = useState('');

  // Tutor: Grading state map
  const [gradingDrafts, setGradingDrafts] = useState<
    Record<string, { score: string; feedback: string }>
  >({});

  const activeClass =
    availableClasses.find((c) => c.id === selectedClassId) ||
    availableClasses[0] ||
    classes[0];

  const classPosts = useMemo(
    () => posts.filter((p) => p.classId === activeClass?.id),
    [posts, activeClass]
  );

  const assignmentCount = useMemo(
    () => classPosts.filter((p) => p.kind === 'assignment').length,
    [classPosts]
  );

  const lectureCount = useMemo(
    () => classPosts.filter((p) => p.kind === 'lecture').length,
    [classPosts]
  );

  const filteredClassPosts = useMemo(() => {
    const q = postSearchQuery.trim().toLowerCase();
    return classPosts.filter((p) => {
      if (p.kind !== postTabFilter) return false;
      if (!q) return true;
      const inTitle = p.title.toLowerCase().includes(q);
      const inContent = p.content.toLowerCase().includes(q);
      const inAttachment = p.attachments.some((a) =>
        a.name.toLowerCase().includes(q)
      );
      return inTitle || inContent || inAttachment;
    });
  }, [classPosts, postTabFilter, postSearchQuery]);

  const classStudents = useMemo(
    () =>
      (activeClass?.studentIds || [])
        .map((id) => students.find((s) => s.id === id))
        .filter(Boolean) as StudentRecord[],
    [activeClass, students]
  );

  const handleCopyCode = () => {
    if (!activeClass) return;
    navigator.clipboard?.writeText(activeClass.classCode).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const handleAddAttachmentToPost = () => {
    if (!newAttName.trim()) return;
    setPostAttachments((prev) => [
      ...prev,
      {
        id: `att-${Date.now()}`,
        name: newAttName.trim(),
        type: newAttType,
        url: newAttUrl.trim() || '#material-preview',
        sizeLabel: newAttType === 'video' ? 'Video bài giảng' : 'Tài liệu đính kèm',
      },
    ]);
    setNewAttName('');
    setNewAttUrl('');
  };

  const handleLocalFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const detectedType: MaterialType = ext.includes('doc')
      ? 'word'
      : ext.includes('ppt')
        ? 'slide'
        : ext.includes('mp4')
          ? 'video'
          : 'pdf';
    setPostAttachments((prev) => [
      ...prev,
      {
        id: `att-${Date.now()}`,
        name: file.name,
        type: detectedType,
        url: URL.createObjectURL(file),
        sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      },
    ]);
  };

  const handleCreatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass) return;
    if (!postTitle.trim()) {
      setPostError('Vui lòng nhập tiêu đề bài giảng hoặc bài tập.');
      return;
    }

    setIsPosting(true);
    setPostError('');
    try {
      const recipientGmails = classStudents.map((s) => s.email);
      const newPost: ClassroomPost = {
        id: `post-${Date.now()}`,
        classId: activeClass.id,
        kind: postKind,
        title: postTitle.trim(),
        content: postContent.trim(),
        createdAt: 'Vừa xong',
        deadline: postKind === 'assignment' ? postDeadline : undefined,
        attachments: postAttachments,
        emailDispatchedTo: recipientGmails,
      };
      await onCreatePost(newPost);
      setPostTabFilter(postKind);
      setPostSearchQuery('');
      setIsPostModalOpen(false);
      setPostTitle('');
      setPostContent('');
      setPostAttachments([]);
    } finally {
      setIsPosting(false);
    }
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitTargetPost) return;
    const finalName = submitFileName.trim() || `Bai_lam_${Date.now()}.jpg`;
    onSubmitHomework({
      id: `sub-${Date.now()}`,
      postId: submitTargetPost.id,
      studentId: currentStudentId,
      submittedAt: 'Vừa xong',
      fileName: finalName,
      fileType: submitFileType,
      previewNote: submitNote.trim(),
      status: 'submitted',
    });
    setSubmitTargetPost(null);
    setSubmitFileName('');
    setSubmitNote('');
  };

  return (
    <div className="space-y-6">
      {/* Class Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {availableClasses.map((cls) => {
            const active = cls.id === activeClass?.id;
            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-4 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cls.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {role === 'student' && (
            <button
              type="button"
              onClick={() => {
                setJoinCodeInput('');
                setJoinFeedback('');
                setIsJoinModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Tham gia bằng mã lớp
            </button>
          )}
          {role === 'tutor' && (
            <button
              type="button"
              onClick={() => {
                setPostError('');
                setIsPostModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Đăng bài giảng / Bài tập
            </button>
          )}
        </div>
      </div>

      {activeClass && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Class Info & Gmail Roster */}
          <aside className="lg:col-span-4 space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {activeClass.subject} · {activeClass.grade}
                </p>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  {activeClass.name}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {activeClass.scheduleSummary}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] text-slate-500">Mã tham gia lớp</p>
                  <p className="text-base font-bold font-mono-num tracking-wider text-blue-700">
                    {activeClass.classCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Đã chép
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Sao chép
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  Học sinh trong lớp ({classStudents.length})
                </h3>
                <span className="text-[11px] text-slate-500">Google Sign-In</span>
              </div>
              <div className="divide-y divide-slate-100 mt-2">
                {classStudents.map((st) => (
                  <div key={st.id} className="py-2.5 flex items-center gap-2.5">
                    <AvatarBadge
                      name={st.name}
                      src={st.avatarUrl}
                      sizeClass="w-8 h-8 text-xs"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {st.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 shrink-0" />
                        {st.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Right: Separated Assignments & Materials Tabs + Live Search */}
          <section className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
              <div
                role="tablist"
                aria-label="Phân mục bài tập và tài liệu"
                className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={postTabFilter === 'assignment'}
                  onClick={() => setPostTabFilter('assignment')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                    postTabFilter === 'assignment'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bài tập về nhà ({assignmentCount})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={postTabFilter === 'lecture'}
                  onClick={() => setPostTabFilter('lecture')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                    postTabFilter === 'lecture'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tài liệu &amp; Bài giảng ({lectureCount})
                </button>
              </div>

              <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={postSearchQuery}
                  onChange={(e) => setPostSearchQuery(e.target.value)}
                  aria-label="Tìm kiếm bài tập hoặc tài liệu"
                  placeholder={
                    postTabFilter === 'assignment'
                      ? 'Tìm bài tập, tên tệp...'
                      : 'Tìm tài liệu, slide, video...'
                  }
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {filteredClassPosts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                <p className="text-sm font-medium text-slate-700">
                  {postSearchQuery.trim()
                    ? `Không tìm thấy kết quả phù hợp cho "${postSearchQuery}"`
                    : postTabFilter === 'assignment'
                      ? 'Lớp học này chưa có bài tập về nhà nào'
                      : 'Lớp học này chưa có tài liệu hoặc bài giảng nào'}
                </p>
                {role === 'tutor' && !postSearchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setPostKind(postTabFilter);
                      setIsPostModalOpen(true);
                    }}
                    className="mt-3 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    {postTabFilter === 'assignment'
                      ? 'Giao bài tập đầu tiên'
                      : 'Đăng tài liệu đầu tiên'}
                  </button>
                )}
              </div>
            ) : (
              filteredClassPosts.map((post) => {
                const postSubmissions = submissions.filter(
                  (s) => s.postId === post.id
                );
                const mySub = postSubmissions.find(
                  (s) => s.studentId === currentStudentId
                );

                return (
                  <article
                    key={post.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span
                            className={`font-semibold ${
                              post.kind === 'assignment'
                                ? 'text-blue-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {post.kind === 'assignment'
                              ? 'Bài tập về nhà'
                              : 'Bài giảng & Tài liệu'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{post.createdAt}</span>
                          {post.deadline && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-700 font-medium tabular-nums">
                                Hạn nộp: {post.deadline.replace('T', ' ')}
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 mt-1">
                          {post.title}
                        </h3>
                      </div>
                    </div>

                    {post.content && (
                      <div className="text-sm text-slate-700 leading-relaxed">
                        <MathRenderer text={post.content} />
                      </div>
                    )}

                    {/* Attachments */}
                    {post.attachments.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {post.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.url}
                            target={att.url.startsWith('http') ? '_blank' : undefined}
                            rel="noreferrer"
                            onClick={(e) => {
                              if (att.url.startsWith('#')) {
                                e.preventDefault();
                              }
                            }}
                            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                          >
                            {MATERIAL_ICONS[att.type]}
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-900 truncate">
                                {att.name}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {att.type.toUpperCase()} · {att.sizeLabel || 'Tài liệu'}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Auto Email Dispatch Receipt */}
                    {post.emailDispatchedTo && post.emailDispatchedTo.length > 0 && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Đã gửi thông báo email tự động tới:{' '}
                        {post.emailDispatchedTo.join(', ')}
                      </p>
                    )}

                    {/* Student Homework Submission Area */}
                    {role === 'student' && post.kind === 'assignment' && (
                      <div className="pt-3 border-t border-slate-100">
                        {mySub ? (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900">
                                Bài đã nộp: {mySub.fileName}
                              </span>
                              <span className="text-slate-500">{mySub.submittedAt}</span>
                            </div>
                            {mySub.previewNote && (
                              <p className="text-slate-600">{mySub.previewNote}</p>
                            )}
                            {mySub.status === 'graded' ? (
                              <div className="pt-2 border-t border-slate-200 text-emerald-800">
                                <p className="font-bold font-mono-num">
                                  Điểm: {mySub.score}/10
                                </p>
                                {mySub.feedback && (
                                  <p className="mt-0.5">Nhận xét: {mySub.feedback}</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-blue-600 font-medium">
                                Đang chờ gia sư chấm bài
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSubmitTargetPost(post)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Nộp bài làm (Ảnh / File)
                          </button>
                        )}
                      </div>
                    )}

                    {/* Tutor Grading Submissions Area */}
                    {role === 'tutor' && post.kind === 'assignment' && (
                      <div className="pt-3 border-t border-slate-100 space-y-2.5">
                        <p className="text-xs font-semibold text-slate-700">
                          Bài nộp của học sinh ({postSubmissions.length}/{classStudents.length})
                        </p>
                        {postSubmissions.length === 0 ? (
                          <p className="text-xs text-slate-400">
                            Chưa có học sinh nào nộp bài tập này.
                          </p>
                        ) : (
                          <div className="space-y-2.5">
                            {postSubmissions.map((sub) => {
                              const stu = students.find((s) => s.id === sub.studentId);
                              const draft = gradingDrafts[sub.id] || {
                                score: sub.score !== undefined ? String(sub.score) : '9',
                                feedback: sub.feedback || '',
                              };

                              return (
                                <div
                                  key={sub.id}
                                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-semibold text-slate-900">
                                      {stu?.name} · {sub.fileName}
                                    </span>
                                    <span className="text-slate-500">
                                      {sub.submittedAt}
                                    </span>
                                  </div>
                                  {sub.previewNote && (
                                    <p className="text-slate-600 italic">
                                      &ldquo;{sub.previewNote}&rdquo;
                                    </p>
                                  )}

                                  {sub.status === 'graded' ? (
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-emerald-800">
                                      <span>
                                        <strong>Điểm: {sub.score}/10</strong> —{' '}
                                        {sub.feedback}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                      <input
                                        type="number"
                                        min={0}
                                        max={10}
                                        step={0.5}
                                        aria-label={`Điểm cho ${stu?.name}`}
                                        value={draft.score}
                                        onChange={(e) =>
                                          setGradingDrafts((prev) => ({
                                            ...prev,
                                            [sub.id]: { ...draft, score: e.target.value },
                                          }))
                                        }
                                        className="w-20 px-2 py-1 border border-slate-300 rounded bg-white font-mono-num"
                                      />
                                      <input
                                        type="text"
                                        placeholder="Nhận xét bài làm..."
                                        aria-label={`Nhận xét cho ${stu?.name}`}
                                        value={draft.feedback}
                                        onChange={(e) =>
                                          setGradingDrafts((prev) => ({
                                            ...prev,
                                            [sub.id]: {
                                              ...draft,
                                              feedback: e.target.value,
                                            },
                                          }))
                                        }
                                        className="flex-1 min-w-[160px] px-2.5 py-1 border border-slate-300 rounded bg-white"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onGradeSubmission(
                                            sub.id,
                                            Number(draft.score) || 0,
                                            draft.feedback || 'Hoàn thành tốt.'
                                          )
                                        }
                                        className="px-3 py-1 bg-emerald-600 text-white font-medium rounded hover:bg-emerald-700"
                                      >
                                        Lưu điểm
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </section>
        </div>
      )}

      {/* Create Lecture / Assignment Modal */}
      {isPostModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Đăng bài giảng hoặc bài tập mới"
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 shadow-xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">
                Đăng bài mới vào {activeClass?.name}
              </h3>
              <button
                type="button"
                aria-label="Đóng cửa sổ đăng bài"
                onClick={() => setIsPostModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePostSubmit} className="mt-4 space-y-4">
              {postError && (
                <p className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {postError}
                </p>
              )}

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPostKind('assignment')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md ${
                    postKind === 'assignment'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  Bài tập về nhà (có hạn nộp)
                </button>
                <button
                  type="button"
                  onClick={() => setPostKind('lecture')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md ${
                    postKind === 'lecture'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  Bài giảng &amp; Tài liệu
                </button>
              </div>

              <div>
                <label
                  htmlFor="post-title"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Tiêu đề
                </label>
                <input
                  id="post-title"
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Ví dụ: Phiếu luyện tập Hàm số bậc nhất Tuần 12"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label
                  htmlFor="post-content"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Hướng dẫn / Nội dung (Hỗ trợ công thức LaTeX $...$)
                </label>
                <textarea
                  id="post-content"
                  rows={3}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Nhắc học sinh làm bài và chụp ảnh nộp trước hạn..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              {postKind === 'assignment' && (
                <div>
                  <label
                    htmlFor="post-deadline"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Hạn nộp bài (Deadline)
                  </label>
                  <input
                    id="post-deadline"
                    type="datetime-local"
                    value={postDeadline}
                    onChange={(e) => setPostDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg tabular-nums"
                  />
                </div>
              )}

              {/* Attachments builder */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Đính kèm tài liệu (PDF, Word, Slide, Video)
                  </span>
                  <label className="text-xs font-medium text-blue-600 hover:underline cursor-pointer">
                    + Tải tệp từ máy
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleLocalFilePick}
                    />
                  </label>
                </div>

                <div className="flex gap-2">
                  <select
                    aria-label="Loại tài liệu"
                    value={newAttType}
                    onChange={(e) => setNewAttType(e.target.value as MaterialType)}
                    className="px-2 py-1.5 text-xs border border-slate-200 rounded bg-white"
                  >
                    <option value="pdf">PDF</option>
                    <option value="word">Word</option>
                    <option value="slide">Slide</option>
                    <option value="video">Video</option>
                    <option value="link">Link</option>
                  </select>
                  <input
                    type="text"
                    value={newAttName}
                    onChange={(e) => setNewAttName(e.target.value)}
                    placeholder="Tên tài liệu hoặc link..."
                    className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttachmentToPost}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-800 text-white rounded hover:bg-slate-900"
                  >
                    Thêm
                  </button>
                </div>

                {postAttachments.length > 0 && (
                  <ul className="space-y-1 text-xs text-slate-700">
                    {postAttachments.map((att) => (
                      <li
                        key={att.id}
                        className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200"
                      >
                        <span className="truncate">
                          [{att.type.toUpperCase()}] {att.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setPostAttachments((prev) =>
                              prev.filter((a) => a.id !== att.id)
                            )
                          }
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-[11px] text-blue-800 flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-blue-600" />
                <span>
                  Khi đăng bài, hệ thống sẽ tạo thông báo chuông &amp; gửi email tới{' '}
                  {classStudents.length} Gmail học sinh trong lớp.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPosting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isPosting ? 'Đang gửi...' : 'Đăng & Gửi thông báo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Join Class By Code Modal */}
      {isJoinModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tham gia lớp học bằng mã lớp"
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">
                Tham gia lớp học
              </h3>
              <button
                type="button"
                aria-label="Đóng cửa sổ tham gia lớp"
                onClick={() => setIsJoinModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label
                htmlFor="join-code-input"
                className="block text-xs font-medium text-slate-700"
              >
                Nhập mã lớp do gia sư cung cấp (ví dụ: LY11NC, TOAN12VIP)
              </label>
              <input
                id="join-code-input"
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="TOAN9A"
                className="w-full px-3 py-2 text-sm font-mono-num uppercase border border-slate-200 rounded-lg"
              />
              {joinFeedback && (
                <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded p-2">
                  {joinFeedback}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = onJoinClassByCode(joinCodeInput);
                    setJoinFeedback(res.message);
                    if (res.ok) {
                      setTimeout(() => setIsJoinModalOpen(false), 900);
                    }
                  }}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Tham gia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Homework Submission Modal */}
      {submitTargetPost && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Nộp bài tập"
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">
                Nộp bài tập về nhà
              </h3>
              <button
                type="button"
                aria-label="Đóng cửa sổ nộp bài"
                onClick={() => setSubmitTargetPost(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleStudentSubmit} className="mt-4 space-y-4">
              <p className="text-xs text-slate-600">{submitTargetPost.title}</p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Chọn tệp hoặc ảnh chụp bài làm
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setSubmitFileName(f.name);
                      setSubmitFileType(
                        f.type.includes('image')
                          ? 'image'
                          : f.name.endsWith('.pdf')
                            ? 'pdf'
                            : 'doc'
                      );
                    }
                  }}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div>
                <label
                  htmlFor="submit-note"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Lời nhắn gửi gia sư
                </label>
                <textarea
                  id="submit-note"
                  rows={2}
                  value={submitNote}
                  onChange={(e) => setSubmitNote(e.target.value)}
                  placeholder="Em nộp bài đúng hạn ạ..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmitTargetPost(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Xác nhận nộp bài
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
