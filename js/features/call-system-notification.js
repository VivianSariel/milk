(function () {
    'use strict';

    /**
     * 系统通知模块 - 为视频来电添加浏览器系统通知
     * 当来电时，如果浏览器不在前台，会发送系统通知
     */

    const S = {
        notificationPermission: false,
        activeNotification: null,
    };

    /**
     * 检查并请求通知权限
     */
    function checkAndRequestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('浏览器不支持通知功能');
            return false;
        }

        if (Notification.permission === 'granted') {
            S.notificationPermission = true;
            return true;
        }

        if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    S.notificationPermission = true;
                }
            });
        }

        return Notification.permission === 'granted';
    }

    /**
     * 发送视频来电系统通知
     */
    function sendCallNotification(partnerName, partnerAvatar) {
        if (!checkAndRequestNotificationPermission()) {
            console.log('通知权限未获得');
            return;
        }

        // 关闭之前的通知
        if (S.activeNotification) {
            S.activeNotification.close();
        }

        try {
            S.activeNotification = new Notification('📞 来电提示', {
                tag: 'video-call-notification',
                requireInteraction: true, // 强制用户交互，不会自动关闭
                icon: partnerAvatar || 'https://file.youtochat.com/images/20260216/1771224856844_qdqqd.jpeg',
                badge: 'https://file.youtochat.com/images/20260216/1771224856844_qdqqd.jpeg',
                body: `${partnerName} 邀请您进行视频通话`,
                tag: 'video-call',
                data: {
                    url: window.location.href,
                    type: 'video-call',
                    callerName: partnerName
                }
            });

            // 点击通知时的处理
            S.activeNotification.addEventListener('click', () => {
                window.focus(); // 将窗口切换到前台
                S.activeNotification.close();
                
                // 如果 call.js 中的函数可用，接听电话
                if (typeof window.callFeature !== 'undefined' && window.callFeature.startCall) {
                    window.callFeature.startCall(true);
                }
            });

            // 通知关闭时的处理
            S.activeNotification.addEventListener('close', () => {
                S.activeNotification = null;
            });

        } catch (e) {
            console.error('发送系统通知失败:', e);
        }
    }

    /**
     * 发送通话结束通知
     */
    function sendCallEndNotification(duration) {
        if (!checkAndRequestNotificationPermission()) return;

        const formattedDuration = formatDuration(duration);

        try {
            const notification = new Notification('📞 通话已结束', {
                tag: 'call-end-notification',
                icon: 'https://file.youtochat.com/images/20260216/1771224856844_qdqqd.jpeg',
                body: `通话时长: ${formattedDuration}`,
                data: {
                    type: 'call-end'
                }
            });

            setTimeout(() => notification.close(), 5000);
        } catch (e) {
            console.error('发送通话结束通知失败:', e);
        }
    }

    /**
     * 发送被拒接通知
     */
    function sendCallRejectedNotification(message) {
        if (!checkAndRequestNotificationPermission()) return;

        try {
            const notification = new Notification('📵 来电被拒', {
                tag: 'call-rejected-notification',
                icon: 'https://file.youtochat.com/images/20260216/1771224856844_qdqqd.jpeg',
                body: message || '对方拒绝了您的通话邀请'
            });

            setTimeout(() => notification.close(), 4000);
        } catch (e) {
            console.error('发送拒接通知失败:', e);
        }
    }

    /**
     * 格式化时长
     */
    function formatDuration(ms) {
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        const h = Math.floor(m / 60);
        
        if (h > 0) {
            return `${h}小时 ${m % 60}分钟 ${s % 60}秒`;
        } else if (m > 0) {
            return `${m}分钟 ${s % 60}秒`;
        } else {
            return `${s}秒`;
        }
    }

    /**
     * 检测页面是否在后台
     */
    function isPageInBackground() {
        return document.hidden || !document.hasFocus?.();
    }

    /**
     * 初始化系统通知支持
     */
    function init() {
        // 当页面获得焦点时，关闭通知
        window.addEventListener('focus', () => {
            if (S.activeNotification) {
                S.activeNotification.close();
                S.activeNotification = null;
            }
        });

        // 检查通知权限
        checkAndRequestNotificationPermission();

        // 在页面退出时关闭通知
        window.addEventListener('beforeunload', () => {
            if (S.activeNotification) {
                S.activeNotification.close();
            }
        });

        console.log('视频来电系统通知模块已初始化');
    }

    // 导出到全局作用域，供 call.js 使用
    window.callSystemNotification = {
        isSupported: () => 'Notification' in window,
        isPermissionGranted: () => S.notificationPermission,
        requestPermission: checkAndRequestNotificationPermission,
        sendCallNotification: (partnerName, avatar) => {
            // 仅在页面后台时发送系统通知
            if (isPageInBackground()) {
                sendCallNotification(partnerName, avatar);
            }
        },
        sendCallEndNotification,
        sendCallRejectedNotification,
        closeActiveNotification: () => {
            if (S.activeNotification) {
                S.activeNotification.close();
                S.activeNotification = null;
            }
        }
    };

    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
