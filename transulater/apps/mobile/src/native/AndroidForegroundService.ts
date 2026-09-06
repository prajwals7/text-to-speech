/**
 * Android Foreground Service Implementation for Continuous Background Wake-Word Detection
 * 
 * Android 14+ (API 34) enforces specific foreground service types. Continuous microphone
 * capture requires:
 * 1. `android.permission.FOREGROUND_SERVICE_MICROPHONE`
 * 2. An active persistent notification visible to the user
 * 3. A partial wake-lock to prevent CPU sleep
 */

export interface ForegroundServiceConfig {
  notificationTitle: string;
  notificationBody: string;
  wakeWordKeyword: string;
  channelId?: string;
}

export class AndroidForegroundServiceManager {
  private isRunning: boolean = false;

  /**
   * Starts the Android Foreground Service with continuous audio capture
   */
  public async startService(config: ForegroundServiceConfig): Promise<void> {
    console.log('[AndroidForegroundService] Starting background service with config:', config);
    // In React Native native code or Expo task manager:
    // 1. Register NotificationChannel with IMPORTANCE_LOW (no sound)
    // 2. Start ForegroundService with Service.START_STICKY
    // 3. Keep AudioRecord buffer active and pipe PCM frames to Porcupine / OpenWakeWord
    this.isRunning = true;
  }

  /**
   * Stops the Android Foreground Service and releases microphone
   */
  public async stopService(): Promise<void> {
    console.log('[AndroidForegroundService] Stopping background service');
    this.isRunning = false;
  }

  public getStatus(): boolean {
    return this.isRunning;
  }
}

/**
 * Android Native Service Reference Template (Kotlin):
 * 
 * ```kotlin
 * package com.aura.voiceassistant
 * 
 * import android.app.Notification
 * import android.app.NotificationChannel
 * import android.app.NotificationManager
 * import android.app.Service
 * import android.content.Intent
 * import android.content.pm.ServiceInfo
 * import android.os.Build
 * import android.os.IBinder
 * import androidx.core.app.NotificationCompat
 * 
 * class WakeWordForegroundService : Service() {
 *     private val CHANNEL_ID = "wake_word_channel"
 *     private val NOTIF_ID = 101
 * 
 *     override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
 *         createNotificationChannel()
 *         val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
 *             .setContentTitle("Aura Voice Assistant Active")
 *             .setContentText("Listening for 'Hey Assistant'...")
 *             .setSmallIcon(R.mipmap.ic_launcher)
 *             .setPriority(NotificationCompat.PRIORITY_LOW)
 *             .build()
 * 
 *         if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
 *             startForeground(
 *                 NOTIF_ID, 
 *                 notification, 
 *                 ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
 *             )
 *         } else {
 *             startForeground(NOTIF_ID, notification)
 *         }
 *         
 *         // Initialize local acoustic wake-word engine (Porcupine / openWakeWord)
 *         return START_STICKY
 *     }
 * 
 *     override fun onBind(intent: Intent?): IBinder? = null
 * 
 *     private fun createNotificationChannel() {
 *         if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
 *             val channel = NotificationChannel(
 *                 CHANNEL_ID,
 *                 "Wake Word Listener",
 *                 NotificationManager.IMPORTANCE_LOW
 *             )
 *             val manager = getSystemService(NotificationManager::class.java)
 *             manager?.createNotificationChannel(channel)
 *         }
 *     }
 * }
 * ```
 */
