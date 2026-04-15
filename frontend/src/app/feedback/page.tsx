'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { feedbackService, Feedback, FeedbackCategory } from '@/services/feedbackService';
import { useToast } from '@/contexts/ToastContext';
import { 
  MessageSquare, 
  Send,
  Bug,
  Lightbulb,
  Zap,
  Palette,
  TrendingUp,
  MoreHorizontal,
  Loader2,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function FeedbackPage() {
  const toast = useToast();
  const [myFeedback, setMyFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadMyFeedback();
  }, []);

  const loadMyFeedback = async () => {
    try {
      const data = await feedbackService.getAll();
      setMyFeedback(data);
    } catch (err) {
      console.error('Failed to load feedback:', err);
      toast.error('Failed to load your feedback');
    } finally {
      setLoading(false);
    }
  };

  const categoryIcons: Record<FeedbackCategory, any> = {
    FEATURE_REQUEST: Lightbulb,
    BUG_REPORT: Bug,
    IMPROVEMENT: Zap,
    UI_UX: Palette,
    PERFORMANCE: TrendingUp,
    OTHER: MoreHorizontal,
  };

  const categoryLabels: Record<FeedbackCategory, string> = {
    FEATURE_REQUEST: 'Feature Request',
    BUG_REPORT: 'Bug Report',
    IMPROVEMENT: 'Improvement',
    UI_UX: 'Design Feedback',
    PERFORMANCE: 'Performance',
    OTHER: 'General Feedback',
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading your feedback...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-12 py-8">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-2">
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-gray-900">
                We'd Love to Hear From You
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Your feedback helps us build a better product. Share your ideas, report issues, or suggest improvements.
              </p>
            </div>
          </div>

          {/* What You Can Share */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">What You Can Share</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">New Features</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Ideas for capabilities that would improve your workflow
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <Bug className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Bug Reports</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Let us know when something isn't working correctly
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Improvements</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Suggestions on how existing features could work better
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
                  <Palette className="h-5 w-5 text-pink-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Design Feedback</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Thoughts on the interface and user experience
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              <MessageSquare className="h-6 w-6" />
              Share Your Feedback
            </button>
          </div>

          {/* Previous Feedback */}
          {myFeedback.length > 0 && (
            <div className="space-y-6">
              <div className="border-t-2 border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Feedback</h2>
              </div>
              
              <div className="space-y-4">
                {myFeedback.map((feedback) => {
                  const CategoryIcon = categoryIcons[feedback.category];
                  const hasResponse = !!feedback.adminResponse;
                  
                  return (
                    <div
                      key={feedback.id}
                      className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {/* Status Icon */}
                        <div className="flex-shrink-0 pt-0.5">
                          {hasResponse ? (
                            <div className="w-11 h-11 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-center justify-center">
                              <CheckCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                          ) : (
                            <div className="w-11 h-11 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center justify-center">
                              <Clock className="h-6 w-6 text-blue-600" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {feedback.title}
                              </h3>
                              <div className="flex items-center gap-2 mb-3">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg">
                                  <CategoryIcon className="h-3.5 w-3.5 text-gray-600" />
                                  <span className="text-xs font-medium text-gray-700">
                                    {categoryLabels[feedback.category]}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                            
                            {hasResponse && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold whitespace-nowrap">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Responded
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-600 leading-relaxed mb-4">
                            {feedback.description}
                          </p>

                          {/* Admin Response */}
                          {feedback.adminResponse && (
                            <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                                </div>
                                <p className="text-sm font-bold text-emerald-900">
                                  Our Response
                                </p>
                              </div>
                              <p className="text-sm text-emerald-800 leading-relaxed pl-8">
                                {feedback.adminResponse}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <CreateFeedbackModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadMyFeedback();
            }}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// Create Feedback Modal
function CreateFeedbackModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: 'FEATURE_REQUEST' as FeedbackCategory,
    title: '',
    description: '',
    priority: 'MEDIUM' as any,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await feedbackService.create(formData);
      toast.success('Thank you for your feedback');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'FEATURE_REQUEST', label: 'Feature Request', icon: Lightbulb, color: 'blue' },
    { value: 'BUG_REPORT', label: 'Bug Report', icon: Bug, color: 'red' },
    { value: 'IMPROVEMENT', label: 'Improvement', icon: Zap, color: 'purple' },
    { value: 'UI_UX', label: 'Design Feedback', icon: Palette, color: 'pink' },
    { value: 'PERFORMANCE', label: 'Performance', icon: TrendingUp, color: 'emerald' },
    { value: 'OTHER', label: 'Other', icon: MoreHorizontal, color: 'gray' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b-2 border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Share Your Feedback</h2>
          </div>
          <p className="text-sm text-gray-600">
            Help us improve CreativeAnchor
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                What type of feedback? <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map(({ value, label, icon: Icon, color }) => {
                  const isSelected = formData.category === value;
                  const colorClasses = {
                    blue: isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300',
                    red: isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300',
                    purple: isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300',
                    pink: isSelected ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300',
                    emerald: isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300',
                    gray: isSelected ? 'border-gray-500 bg-gray-50' : 'border-gray-200 hover:border-gray-300',
                  };

                  const iconColorClasses = {
                    blue: isSelected ? 'text-blue-600' : 'text-gray-400',
                    red: isSelected ? 'text-red-600' : 'text-gray-400',
                    purple: isSelected ? 'text-purple-600' : 'text-gray-400',
                    pink: isSelected ? 'text-pink-600' : 'text-gray-400',
                    emerald: isSelected ? 'text-emerald-600' : 'text-gray-400',
                    gray: isSelected ? 'text-gray-600' : 'text-gray-400',
                  };

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: value as FeedbackCategory })}
                      className={`flex items-center gap-3 px-4 py-3.5 border-2 rounded-xl transition-all text-left ${colorClasses[color as keyof typeof colorClasses]}`}
                    >
                      <Icon className={`h-5 w-5 flex-shrink-0 ${iconColorClasses[color as keyof typeof iconColorClasses]}`} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Brief Summary <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400"
                placeholder="e.g., Add ability to export invoices to Excel"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-2">
                A clear, one-line description
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Details <span className="text-red-600">*</span>
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={7}
                className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400 resize-none"
                placeholder="Please provide as much context as possible. For bugs, include what you were doing when the issue occurred."
              />
              <p className="text-xs text-gray-500 mt-2">
                More details help us understand and address your feedback better
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t-2 border-gray-200 bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-white transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Send Feedback
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}