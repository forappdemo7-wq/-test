import React, { Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileHeader } from './components/layout/MobileHeader';
import { BottomNav } from './components/layout/BottomNav';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { InAppMessageToast } from './components/messages/InAppMessageToast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import {
  FeedListSkeleton,
  ExploreSkeleton,
  ReelsSkeleton,
  MessagesSkeleton,
  NotificationsSkeleton,
  ProfileSkeleton,
} from './components/common/Skeletons';

// Route Code Splitting: Lazy loaded primary views
const FeedList = lazy(() =>
  import('./components/feed/FeedList').then((m) => ({ default: m.FeedList }))
);
const ExploreGrid = lazy(() =>
  import('./components/explore/ExploreGrid').then((m) => ({ default: m.ExploreGrid }))
);
const ReelsViewer = lazy(() =>
  import('./components/reels/ReelsViewer').then((m) => ({ default: m.ReelsViewer }))
);
const DirectMessagesView = lazy(() =>
  import('./components/messages/DirectMessagesView').then((m) => ({ default: m.DirectMessagesView }))
);
const NotificationsView = lazy(() =>
  import('./components/notifications/NotificationsView').then((m) => ({ default: m.NotificationsView }))
);
const ProfileView = lazy(() =>
  import('./components/profile/ProfileView').then((m) => ({ default: m.ProfileView }))
);

// Code Splitting: Lazy loaded modals & overlay sheets
const StoryViewer = lazy(() =>
  import('./components/stories/StoryViewer').then((m) => ({ default: m.StoryViewer }))
);
const CommentsModal = lazy(() =>
  import('./components/feed/CommentsModal').then((m) => ({ default: m.CommentsModal }))
);
const ShareModal = lazy(() =>
  import('./components/feed/ShareModal').then((m) => ({ default: m.ShareModal }))
);
const PostDetailModal = lazy(() =>
  import('./components/feed/PostDetailModal').then((m) => ({ default: m.PostDetailModal }))
);
const CreateModal = lazy(() =>
  import('./components/create/CreateModal').then((m) => ({ default: m.CreateModal }))
);
const EditProfileModal = lazy(() =>
  import('./components/profile/EditProfileModal').then((m) => ({ default: m.EditProfileModal }))
);
const UserListModal = lazy(() =>
  import('./components/profile/UserListModal').then((m) => ({ default: m.UserListModal }))
);
const UserProfileModal = lazy(() =>
  import('./components/profile/UserProfileModal').then((m) => ({ default: m.UserProfileModal }))
);
const AuthModal = lazy(() =>
  import('./components/auth/AuthModal').then((m) => ({ default: m.AuthModal }))
);

const MainLayout: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setActiveThreadId,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    selectedUserProfile,
    setSelectedUserProfile,
    inAppMessageToast,
    dismissInAppToast,
    sendInAppToastReply,
    activeStoryGroupIndex,
    activeCommentsPost,
    activeSharePost,
    selectedPostForDetail,
    isCreateOpen,
    isEditProfileOpen,
    userListModal,
  } = useApp();

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-neutral-950 text-slate-900 dark:text-neutral-100 flex flex-col sm:flex-row transition-colors selection:bg-pink-500 selection:text-white">
      {/* Desktop Left Sidebar */}
      <DesktopSidebar />

      {/* In-App Push Notification Toast */}
      {inAppMessageToast && (
        <InAppMessageToast
          sender={inAppMessageToast.sender}
          message={inAppMessageToast.message}
          threadId={inAppMessageToast.threadId}
          onOpenChat={(threadId) => {
            setActiveThreadId(threadId);
            setActiveTab('messages');
            dismissInAppToast();
          }}
          onQuickReply={(threadId, text) => {
            sendInAppToastReply(threadId, text);
          }}
          onDismiss={dismissInAppToast}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Mobile Header (Hidden on tablet/desktop) */}
        <header className="sm:hidden sticky top-0 z-30">
          <MobileHeader />
        </header>

        {/* Tab Views with Smooth Suspense & Spring Transitions */}
        <section className="flex-1 w-full relative" aria-label="Tab Content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="w-full h-full"
            >
              {activeTab === 'feed' && (
                <Suspense fallback={<FeedListSkeleton />}>
                  <FeedList />
                </Suspense>
              )}
              {activeTab === 'explore' && (
                <Suspense fallback={<ExploreSkeleton />}>
                  <ExploreGrid />
                </Suspense>
              )}
              {activeTab === 'reels' && (
                <Suspense fallback={<ReelsSkeleton />}>
                  <ReelsViewer />
                </Suspense>
              )}
              {activeTab === 'messages' && (
                <Suspense fallback={<MessagesSkeleton />}>
                  <DirectMessagesView />
                </Suspense>
              )}
              {activeTab === 'notifications' && (
                <Suspense fallback={<NotificationsSkeleton />}>
                  <NotificationsView />
                </Suspense>
              )}
              {activeTab === 'profile' && (
                <Suspense fallback={<ProfileSkeleton />}>
                  <ProfileView />
                </Suspense>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </main>

      {/* Global Modals & Overlays (Conditionally Loaded with Suspense) */}
      <Suspense fallback={null}>
        {activeStoryGroupIndex !== null && <StoryViewer />}
        {activeCommentsPost && <CommentsModal />}
        {activeSharePost && <ShareModal />}
        {selectedPostForDetail && <PostDetailModal />}
        {isCreateOpen && <CreateModal />}
        {isEditProfileOpen && <EditProfileModal />}
        {userListModal && <UserListModal />}
        {selectedUserProfile && (
          <UserProfileModal
            user={selectedUserProfile}
            onClose={() => setSelectedUserProfile(null)}
          />
        )}
        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            initialMode={authModalMode}
          />
        )}
      </Suspense>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}
