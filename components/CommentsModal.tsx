import React, { useState, useEffect } from 'react';
import { Task, TaskComment, TeamMemberName, TEAM_MEMBERS } from '../types';
import { X, Send, MessageCircle, User } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onSaveComment: (taskId: string, comment: Omit<TaskComment, 'id'>) => void;
  currentUser: TeamMemberName;
  onCurrentUserChange?: (user: TeamMemberName) => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  task,
  onSaveComment,
  currentUser = 'Stiven',
  onCurrentUserChange
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewComment('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const comment: Omit<TaskComment, 'id'> = {
        text: newComment.trim(),
        author: currentUser,
        createdAt: Date.now()
      };

      onSaveComment(task.id, comment);
      setNewComment('');
    } catch (error) {
      console.error('Error saving comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAuthorInfo = (authorName: TeamMemberName) => {
    return TEAM_MEMBERS.find(m => m.name === authorName) || TEAM_MEMBERS[0];
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md md:max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageCircle size={18} className="text-blue-500" />
            Comentarios - {task.title}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 md:p-6 max-h-[60vh] overflow-y-auto">
          {/* Existing Comments */}
          {task.comments && task.comments.length > 0 ? (
            <div className="space-y-4 mb-6">
              {task.comments.map((comment) => {
                const author = getAuthorInfo(comment.author);
                return (
                  <div key={comment.id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${author.color}`}>
                        {author.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-200">{author.name}</span>
                          <span className="text-xs text-slate-500">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay comentarios aún</p>
            </div>
          )}

          {/* Add New Comment */}
          <form onSubmit={handleSubmit} className="border-t border-slate-800 pt-4">
            {/* User Selector */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-400 mb-2">Comentando como:</label>
              <select
                value={currentUser}
                onChange={(e) => {
                  const newUser = e.target.value as TeamMemberName;
                  onCurrentUserChange?.(newUser);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {TEAM_MEMBERS.map(member => (
                  <option key={member.name} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${getAuthorInfo(currentUser).color} flex-shrink-0`}>
                {getAuthorInfo(currentUser).initials}
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  disabled={isSubmitting}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Send size={14} />
                    {isSubmitting ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;