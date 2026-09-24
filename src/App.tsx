import React, { Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileHeader } from './components/layout/MobileHeader';
import { BottomNav } from './components/layout/BottomNav';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { InAppMessageToast } from './components/messages/InAppMessageToast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { FeatureErrorBoundary } from './components/common/FeatureErrorBoundary';
import { AuthPage } from './components/auth/AuthPage';
import { Toaster } from 'react-hot-toast';
import {
  FeedListSkeleton,
  ExploreSkeleton,
  ReelsSkeleton,
  MessagesSkeleton,
  NotificationsSkeleton,
  ProfileSkeleton,
} from './components/common/Skeletons';

// Auto-retrying lazy loader for tabs and overlay modals
const lazyWithRetry = (factory: () => Promise<any>) =>
  lazy(async () => {
    try {
      return await factory();
    } catch {
      await new Promise((r) => setTimeout(r, 400));
      return await factory();
    }
  });

// Code Splitting: Main Tab Views
const FeedList = lazyWithRetry(() =>
  import('./components/feed/FeedList').then((m) => ({ default: m.FeedList }))
);
const ExploreGrid = lazyWithRetry(() =>
  import('./components/explore/ExploreGrid').then((m) => ({ default: m.ExploreGrid }))
);
const ReelsViewer = lazyWithRetry(() =>
  import('./components/reels/ReelsViewer').then((m) => ({ default: m.ReelsViewer }))
);
const DirectMessagesView = lazyWithRetry(() =>
  import('./components/messages/DirectMessagesView').then((m) => ({ default: m.DirectMessagesView }))
);
const NotificationsView = lazyWithRetry(() =>
  import('./components/notifications/NotificationsView').then((m) => ({ default: m.NotificationsView }))
);
const ProfileView = lazyWithRetry(() =>
  import('./components/profile/ProfileView').then((m) => ({ default: m.ProfileView }))
);

// Code Splitting: Lazy loaded modals & overlay sheets
const StoryViewer = lazyWithRetry(() =>
  import('./components/stories/StoryViewer').then((m) => ({ default: m.StoryViewer }))
);
const CommentsModal = lazyWithRetry(() =>
  import('./components/feed/CommentsModal').then((m) => ({ default: m.CommentsModal }))
);
const ShareModal = lazyWithRetry(() =>
  import('./components/feed/ShareModal').then((m) => ({ default: m.ShareModal }))
);
const PostDetailModal = lazyWithRetry(() =>
  import('./components/feed/PostDetailModal').then((m) => ({ default: m.PostDetailModal }))
);
const CreateModal = lazyWithRetry(() =>
  import('./components/create/CreateModal').then((m) => ({ default: m.CreateModal }))
);
const EditProfileModal = lazyWithRetry(() =>
  import('./components/profile/EditProfileModal').then((m) => ({ default: m.EditProfileModal }))
);
const UserListModal = lazyWithRetry(() =>
  import('./components/profile/UserListModal').then((m) => ({ default: m.UserListModal }))
);
const UserProfileModal = lazyWithRetry(() =>
  import('./components/profile/UserProfileModal').then((m) => ({ default: m.UserProfileModal }))
);
const AuthModal = lazyWithRetry(() =>
  import('./components/auth/AuthModal').then((m) => ({ default: m.AuthModal }))
);
const AudioDetailModal = lazyWithRetry(() =>
  import('./components/audio/AudioDetailModal').then((m) => ({ default: m.AudioDetailModal }))
);

const MainLayout: React.FC = () => {
  const {
    isAuthenticated,
    currentUser,
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
    activeAudioTrack,
    closeAudioDetail,
    openCreateWithAudio,
  } = useApp();

  if (!isAuthenticated || !currentUser) {
    return <AuthPage />;
  }

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
                <FeatureErrorBoundary featureName="Feed">
                  <Suspense fallback={<FeedListSkeleton />}>
                    <FeedList />
                  </Suspense>
                </FeatureErrorBoundary>
              )}
              {activeTab === 'explore' && (
                <FeatureErrorBoundary featureName="Explore">
                  <Suspense fallback={<ExploreSkeleton />}>
                    <ExploreGrid />
                  </Suspense>
                </FeatureErrorBoundary>
              )}
              {activeTab === 'reels' && (
                <FeatureErrorBoundary featureName="Reels">
                  <Suspense fallback={<ReelsSkeleton />}>
                    <ReelsViewer />
                  </Suspense>
                </FeatureErrorBoundary>
              )}
              {activeTab === 'messages' && (
                <FeatureErrorBoundary featureName="Messages">
                  <Suspense fallback={<MessagesSkeleton />}>
                    <DirectMessagesView />
                  </Suspense>
                </FeatureErrorBoundary>
              )}
              {activeTab === 'notifications' && (
                <FeatureErrorBoundary featureName="Notifications">
                  <Suspense fallback={<NotificationsSkeleton />}>
                    <NotificationsView />
                  </Suspense>
                </FeatureErrorBoundary>
              )}
              {activeTab === 'profile' && (
                <FeatureErrorBoundary featureName="Profile">
                  <Suspense fallback={<ProfileSkeleton />}>
                    <ProfileView />
                  </Suspense>
                </FeatureErrorBoundary>
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
        {activeAudioTrack && (
          <AudioDetailModal
            track={activeAudioTrack}
            onClose={closeAudioDetail}
            onUseSound={(track) => openCreateWithAudio(track, 'reel')}
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
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '16px',
            }
          }}
        />
      </AppProvider>
    </ErrorBoundary>
  );
}
