package br.com.infocedro.promocontrol;

import br.com.infocedro.promocontrol.launcher.OperationalLauncherFrame;
import java.awt.GraphicsEnvironment;
import java.awt.Toolkit;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.RandomAccessFile;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import javax.swing.SwingUtilities;

public class PromoControlLauncher {

    private static final String LAUNCHER_ENABLED_PROPERTY = "promocontrol.launcher.enabled";
    private static final String SINGLE_INSTANCE_LOCK_FILE = "promocontrol-launcher.lock";
    private static final int SINGLE_INSTANCE_PORT = 45673;
    private static final String SHOW_PANEL_COMMAND = "SHOW_PANEL";
    private static SingleInstanceHandle singleInstanceHandle;
    private static OperationalLauncherFrame launcherFrame;

    public static void main(String[] args) {
        if (!isLauncherEnabled() || GraphicsEnvironment.isHeadless()) {
            PromocontrolApplication.start(args);
            return;
        }

        singleInstanceHandle = SingleInstanceHandle.tryAcquire();
        if (singleInstanceHandle == null) {
            notifyRunningInstance();
            Toolkit.getDefaultToolkit().beep();
            System.exit(0);
            return;
        }

        Runtime.getRuntime().addShutdownHook(new Thread(singleInstanceHandle::close, "promocontrol-launcher-lock-release"));
        startCommandListener();
        SwingUtilities.invokeLater(() -> {
            launcherFrame = new OperationalLauncherFrame(args);
            launcherFrame.setVisible(true);
        });
    }

    private static boolean isLauncherEnabled() {
        return Boolean.parseBoolean(System.getProperty(LAUNCHER_ENABLED_PROPERTY, "false"));
    }

    private static void startCommandListener() {
        Thread listenerThread = new Thread(() -> {
            try (ServerSocket serverSocket = new ServerSocket(SINGLE_INSTANCE_PORT, 50, InetAddress.getLoopbackAddress())) {
                while (!Thread.currentThread().isInterrupted()) {
                    try (Socket socket = serverSocket.accept();
                         BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8))) {
                        String command = reader.readLine();
                        if (SHOW_PANEL_COMMAND.equals(command) && launcherFrame != null) {
                            SwingUtilities.invokeLater(launcherFrame::restoreFromExternalRequest);
                        }
                    } catch (IOException ignored) {
                    }
                }
            } catch (IOException ignored) {
            }
        }, "promocontrol-launcher-command-listener");
        listenerThread.setDaemon(true);
        listenerThread.start();
    }

    private static void notifyRunningInstance() {
        try (Socket socket = new Socket(InetAddress.getLoopbackAddress(), SINGLE_INSTANCE_PORT);
             BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8))) {
            writer.write(SHOW_PANEL_COMMAND);
            writer.newLine();
            writer.flush();
        } catch (IOException ignored) {
        }
    }

    private static final class SingleInstanceHandle implements AutoCloseable {
        private final RandomAccessFile file;
        private final FileChannel channel;
        private final FileLock lock;

        private SingleInstanceHandle(RandomAccessFile file, FileChannel channel, FileLock lock) {
            this.file = file;
            this.channel = channel;
            this.lock = lock;
        }

        private static SingleInstanceHandle tryAcquire() {
            try {
                Path lockPath = Path.of(System.getProperty("java.io.tmpdir"), SINGLE_INSTANCE_LOCK_FILE);
                RandomAccessFile file = new RandomAccessFile(lockPath.toFile(), "rw");
                FileChannel channel = file.getChannel();
                FileLock lock = channel.tryLock();
                if (lock == null) {
                    channel.close();
                    file.close();
                    return null;
                }
                return new SingleInstanceHandle(file, channel, lock);
            } catch (IOException exception) {
                throw new IllegalStateException("Nao foi possivel criar a trava de instancia unica.", exception);
            }
        }

        @Override
        public void close() {
            try {
                if (lock != null && lock.isValid()) {
                    lock.release();
                }
            } catch (IOException ignored) {
            }

            try {
                if (channel != null && channel.isOpen()) {
                    channel.close();
                }
            } catch (IOException ignored) {
            }

            try {
                file.close();
            } catch (IOException ignored) {
            }
        }
    }
}
