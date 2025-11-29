'use client';

import { useSync } from '@/lib/hooks/useSync';
import { Icons } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

export function SyncSettings() {
    const {
        user,
        isInitialized,
        isLoading,
        error,
        lastSynced,
        autoSync,
        toggleAutoSync,
        signIn,
        signOut,
        syncNow,
        restoreNow
    } = useSync();

    if (!isInitialized) {
        return (
            <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-sm)] p-6">
                <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--accent-color)] border-t-transparent"></div>
                    <span className="text-[var(--text-color-secondary)]">正在初始化同步服务...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-sm)] p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[var(--text-color)] flex items-center gap-2">
                    <Icons.Cloud size={24} />
                    <span>云端同步 (Google Drive)</span>
                </h2>
                {user && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--text-color-secondary)]">
                            {user.email}
                        </span>
                        <Button
                            variant="ghost"
                            onClick={signOut}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            退出
                        </Button>
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[var(--radius-xl)] text-sm text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {!user ? (
                <div className="text-center py-6">
                    <p className="text-[var(--text-color-secondary)] mb-4">
                        登录 Google 账号以在设备间同步您的设置和历史记录。
                        数据将存储在您 Google Drive 的专用应用文件夹中。
                    </p>
                    <Button onClick={signIn} variant="primary" className="w-full sm:w-auto">
                        <Icons.Google className="mr-2" size={20} />
                        连接 Google Drive
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[var(--radius-xl)]">
                        <div>
                            <p className="font-medium text-[var(--text-color)]">自动同步</p>
                            <p className="text-sm text-[var(--text-color-secondary)]">
                                更改设置或观看视频时自动同步
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={autoSync}
                                onChange={(e) => toggleAutoSync(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--accent-color)]"></div>
                        </label>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={syncNow}
                            disabled={isLoading}
                            className="flex-1"
                            variant="secondary"
                        >
                            {isLoading ? '同步中...' : '立即同步 (上传)'}
                        </Button>
                        <Button
                            onClick={restoreNow}
                            disabled={isLoading}
                            className="flex-1"
                            variant="secondary"
                        >
                            {isLoading ? '同步中...' : '立即恢复 (下载)'}
                        </Button>
                    </div>

                    {lastSynced && (
                        <p className="text-xs text-center text-[var(--text-color-secondary)]">
                            上次同步: {lastSynced.toLocaleString()}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
