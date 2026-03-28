package br.com.infocedro.promocontrol.launcher;

import br.com.infocedro.promocontrol.PromocontrolApplication;
import java.awt.BasicStroke;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Desktop;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.GridLayout;
import java.awt.Image;
import java.awt.MenuItem;
import java.awt.PopupMenu;
import java.awt.RenderingHints;
import java.awt.SystemTray;
import java.awt.Toolkit;
import java.awt.TrayIcon;
import java.awt.geom.Path2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Objects;
import java.util.Properties;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.SwingUtilities;
import org.springframework.context.ConfigurableApplicationContext;

public class OperationalLauncherFrame extends JFrame {

    private static final AtomicBoolean STREAMS_REDIRECTED = new AtomicBoolean(false);
    private static final DateTimeFormatter TIMESTAMP_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final Color STATUS_STARTING = new Color(184, 115, 51);
    private static final Color STATUS_ONLINE = new Color(44, 124, 81);
    private static final Color STATUS_ERROR = new Color(176, 55, 55);
    private static final Color STATUS_STOPPED = new Color(90, 98, 108);

    private final String[] backendArgs;
    private final ExecutorService backendExecutor;
    private final JTextArea consoleArea;
    private final JLabel statusBadge;
    private final JLabel detailsLabel;
    private final JButton openButton;
    private final JButton startButton;
    private final JButton restartButton;
    private final JButton stopButton;
    private final String appVersion;
    private final String activeProfile;
    private final String frontUrl;
    private final Image trayImage;
    private final boolean traySupported;
    private TrayIcon trayIcon;
    private boolean exitRequested;
    private boolean trayHintShown;

    private volatile ConfigurableApplicationContext applicationContext;
    private volatile boolean starting;

    public OperationalLauncherFrame(String[] backendArgs) {
        this.backendArgs = backendArgs.clone();
        this.backendExecutor = Executors.newSingleThreadExecutor(new LauncherThreadFactory());
        this.consoleArea = new JTextArea();
        this.statusBadge = new JLabel();
        this.detailsLabel = new JLabel();
        this.openButton = new JButton("Abrir PromoControl");
        this.startButton = new JButton("Iniciar");
        this.restartButton = new JButton("Reiniciar");
        this.stopButton = new JButton("Encerrar");

        Properties properties = loadApplicationProperties();
        this.appVersion = properties.getProperty("info.app.version", "desconhecida");
        this.activeProfile = System.getProperty("spring.profiles.active",
                properties.getProperty("spring.profiles.default", "prod"));
        this.frontUrl = resolveFrontUrl(properties.getProperty("api.base.url", "http://localhost:8080"));
        this.trayImage = createWindowIcon(16);
        this.traySupported = SystemTray.isSupported();

        configureFrame();
        configureTray();
        configureActions();
        redirectSystemStreams();
        appendLauncherMessage("Launcher operacional iniciado.");
        appendLauncherMessage("Versao " + appVersion + " | Perfil " + activeProfile);
        startBackend();
    }

    private void configureFrame() {
        setTitle("PromoControl | Painel Operacional");
        setDefaultCloseOperation(DO_NOTHING_ON_CLOSE);
        setMinimumSize(new Dimension(940, 620));
        setPreferredSize(new Dimension(1040, 720));
        setIconImages(java.util.List.of(
                (BufferedImage) trayImage,
                createWindowIcon(24),
                createWindowIcon(32),
                createWindowIcon(48),
                createWindowIcon(64)));

        JPanel content = new JPanel(new BorderLayout(0, 16));
        content.setBorder(BorderFactory.createEmptyBorder(18, 18, 18, 18));
        content.add(buildHeader(), BorderLayout.NORTH);
        content.add(buildConsole(), BorderLayout.CENTER);
        content.add(buildFooter(), BorderLayout.SOUTH);
        setContentPane(content);

        addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent event) {
                handleWindowClose();
            }
        });

        pack();
        setLocationRelativeTo(null);
        updateStatus("Iniciando", STATUS_STARTING);
        updateButtons();
    }

    private JPanel buildHeader() {
        JPanel header = new JPanel(new BorderLayout(12, 12));

        JPanel titlePanel = new JPanel();
        titlePanel.setLayout(new BoxLayout(titlePanel, BoxLayout.Y_AXIS));

        JLabel title = new JLabel("PromoControl");
        title.setFont(new Font("Segoe UI", Font.BOLD, 28));

        JLabel subtitle = new JLabel("Painel operacional do servidor local");
        subtitle.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        subtitle.setForeground(new Color(86, 92, 105));

        statusBadge.setOpaque(true);
        statusBadge.setForeground(Color.WHITE);
        statusBadge.setBorder(BorderFactory.createEmptyBorder(6, 12, 6, 12));
        statusBadge.setFont(new Font("Segoe UI", Font.BOLD, 13));
        statusBadge.setAlignmentX(LEFT_ALIGNMENT);

        titlePanel.add(title);
        titlePanel.add(Box.createVerticalStrut(4));
        titlePanel.add(subtitle);
        titlePanel.add(Box.createVerticalStrut(10));
        titlePanel.add(statusBadge);

        JPanel infoPanel = new JPanel(new GridLayout(0, 1, 0, 6));
        infoPanel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(216, 221, 229)),
                BorderFactory.createEmptyBorder(10, 14, 10, 14)));

        detailsLabel.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        infoPanel.add(new JLabel("URL: " + frontUrl));
        infoPanel.add(new JLabel("Perfil: " + activeProfile));
        infoPanel.add(new JLabel("Versao: " + appVersion));
        infoPanel.add(detailsLabel);

        header.add(titlePanel, BorderLayout.WEST);
        header.add(infoPanel, BorderLayout.EAST);
        return header;
    }

    private JScrollPane buildConsole() {
        consoleArea.setEditable(false);
        consoleArea.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 13));
        consoleArea.setLineWrap(true);
        consoleArea.setWrapStyleWord(true);
        consoleArea.setBackground(new Color(18, 20, 24));
        consoleArea.setForeground(new Color(231, 235, 240));
        consoleArea.setCaretColor(new Color(231, 235, 240));
        consoleArea.setBorder(BorderFactory.createEmptyBorder(12, 12, 12, 12));

        JScrollPane scrollPane = new JScrollPane(consoleArea);
        scrollPane.setBorder(BorderFactory.createTitledBorder("Console do servidor"));
        return scrollPane;
    }

    private JPanel buildFooter() {
        JPanel footer = new JPanel(new BorderLayout());

        JPanel actions = new JPanel();
        actions.add(openButton);
        actions.add(startButton);
        actions.add(restartButton);
        actions.add(stopButton);

        JLabel hint = new JLabel("Use este painel para acompanhar o Spring Boot e abrir o front web.");
        hint.setForeground(new Color(86, 92, 105));

        footer.add(hint, BorderLayout.WEST);
        footer.add(actions, BorderLayout.EAST);
        return footer;
    }

    private void configureActions() {
        openButton.addActionListener(event -> openBrowser());
        startButton.addActionListener(event -> startBackend());
        restartButton.addActionListener(event -> restartBackend());
        stopButton.addActionListener(event -> requestExit());
    }

    private void configureTray() {
        if (!traySupported) {
            appendLauncherMessage("System tray indisponivel neste ambiente.");
            return;
        }

        PopupMenu popupMenu = new PopupMenu();

        MenuItem showItem = new MenuItem("Mostrar painel");
        showItem.addActionListener(event -> restoreFromTray());
        popupMenu.add(showItem);

        MenuItem openItem = new MenuItem("Abrir PromoControl");
        openItem.addActionListener(event -> {
            restoreFromTray();
            openBrowser();
        });
        popupMenu.add(openItem);

        MenuItem restartItem = new MenuItem("Reiniciar servidor");
        restartItem.addActionListener(event -> restartBackend());
        popupMenu.add(restartItem);

        MenuItem settingsItem = new MenuItem("Configuracoes");
        settingsItem.addActionListener(event -> showSettingsPlaceholder());
        popupMenu.add(settingsItem);

        popupMenu.addSeparator();

        MenuItem exitItem = new MenuItem("Sair");
        exitItem.addActionListener(event -> requestExit());
        popupMenu.add(exitItem);

        trayIcon = new TrayIcon(trayImage, "PromoControl", popupMenu);
        trayIcon.setImageAutoSize(true);
        trayIcon.addActionListener(event -> restoreFromTray());

        try {
            SystemTray.getSystemTray().add(trayIcon);
            updateTrayTooltip("Pronto para iniciar");
        } catch (Exception exception) {
            appendLauncherMessage("Nao foi possivel registrar o icone na bandeja: " + exception.getMessage());
            trayIcon = null;
        }
    }

    private void startBackend() {
        if (starting || applicationContext != null) {
            return;
        }

        starting = true;
        updateStatus("Iniciando", STATUS_STARTING);
        updateDetails("Subindo servidor local...");
        updateButtons();
        appendLauncherMessage("Iniciando backend Spring Boot.");

        backendExecutor.submit(() -> {
            try {
                ConfigurableApplicationContext context = PromocontrolApplication.start(backendArgs);
                applicationContext = context;
                starting = false;
                SwingUtilities.invokeLater(() -> {
                    updateStatus("Online", STATUS_ONLINE);
                    updateDetails("Servidor online em " + frontUrl);
                    updateButtons();
                    updateTrayTooltip("Online");
                    appendLauncherMessage("Servidor pronto para uso.");
                });
            } catch (Exception exception) {
                applicationContext = null;
                starting = false;
                SwingUtilities.invokeLater(() -> {
                    updateStatus("Erro", STATUS_ERROR);
                    updateDetails("Falha ao iniciar o servidor.");
                    updateButtons();
                    updateTrayTooltip("Erro");
                    appendLauncherMessage("Falha ao iniciar: " + rootMessage(exception));
                });
            }
        });
    }

    private void stopBackend() {
        if (starting || applicationContext == null) {
            return;
        }

        ConfigurableApplicationContext contextToStop = applicationContext;
        applicationContext = null;
        updateStatus("Encerrando", STATUS_STOPPED);
        updateDetails("Encerrando servidor...");
        updateButtons();
        updateTrayTooltip("Encerrando");
        appendLauncherMessage("Encerrando backend.");

        backendExecutor.submit(() -> {
            PromocontrolApplication.stop(contextToStop);
            SwingUtilities.invokeLater(() -> {
                updateStatus("Parado", STATUS_STOPPED);
                updateDetails("Servidor parado.");
                updateButtons();
                updateTrayTooltip("Parado");
                appendLauncherMessage("Servidor encerrado com sucesso.");
            });
        });
    }

    private void restartBackend() {
        appendLauncherMessage("Reiniciando backend.");
        if (applicationContext != null) {
            ConfigurableApplicationContext contextToRestart = applicationContext;
            applicationContext = null;
            starting = true;
            updateStatus("Reiniciando", STATUS_STARTING);
            updateDetails("Reiniciando servidor...");
            updateButtons();
            updateTrayTooltip("Reiniciando");

            backendExecutor.submit(() -> {
                try {
                    PromocontrolApplication.stop(contextToRestart);
                    ConfigurableApplicationContext newContext = PromocontrolApplication.start(backendArgs);
                    applicationContext = newContext;
                    starting = false;
                    SwingUtilities.invokeLater(() -> {
                        updateStatus("Online", STATUS_ONLINE);
                        updateDetails("Servidor online em " + frontUrl);
                        updateButtons();
                        updateTrayTooltip("Online");
                        appendLauncherMessage("Servidor reiniciado com sucesso.");
                    });
                } catch (Exception exception) {
                    applicationContext = null;
                    starting = false;
                    SwingUtilities.invokeLater(() -> {
                        updateStatus("Erro", STATUS_ERROR);
                        updateDetails("Falha ao reiniciar o servidor.");
                        updateButtons();
                        updateTrayTooltip("Erro");
                        appendLauncherMessage("Falha ao reiniciar: " + rootMessage(exception));
                    });
                }
            });
            return;
        }

        startBackend();
    }

    private void openBrowser() {
        if (!Desktop.isDesktopSupported()) {
            appendLauncherMessage("Desktop nao suportado neste ambiente.");
            return;
        }

        try {
            Desktop.getDesktop().browse(URI.create(frontUrl));
            appendLauncherMessage("Abrindo navegador em " + frontUrl);
        } catch (IOException exception) {
            appendLauncherMessage("Nao foi possivel abrir o navegador: " + exception.getMessage());
        }
    }

    private void handleWindowClose() {
        if (exitRequested) {
            shutdownAndExit();
            return;
        }

        if (!traySupported || trayIcon == null) {
            requestExit();
            return;
        }

        minimizeToTray();
    }

    private void requestExit() {
        int choice = JOptionPane.showConfirmDialog(
                this,
                "Deseja encerrar o painel e o servidor do PromoControl?",
                "Encerrar PromoControl",
                JOptionPane.YES_NO_OPTION,
                JOptionPane.QUESTION_MESSAGE);

        if (choice != JOptionPane.YES_OPTION) {
            return;
        }

        exitRequested = true;
        shutdownAndExit();
    }

    private void shutdownAndExit() {
        openButton.setEnabled(false);
        startButton.setEnabled(false);
        restartButton.setEnabled(false);
        stopButton.setEnabled(false);

        backendExecutor.submit(() -> {
            PromocontrolApplication.stop(applicationContext);
            backendExecutor.shutdownNow();
            SwingUtilities.invokeLater(() -> {
                removeTrayIcon();
                dispose();
                System.exit(0);
            });
        });
    }

    private void minimizeToTray() {
        setVisible(false);
        if (!trayHintShown && trayIcon != null) {
            trayIcon.displayMessage(
                    "PromoControl",
                    "O servidor segue online na bandeja do sistema.",
                    TrayIcon.MessageType.INFO);
            trayHintShown = true;
        }
        appendLauncherMessage("Painel minimizado para a bandeja do sistema.");
    }

    private void restoreFromTray() {
        SwingUtilities.invokeLater(() -> {
            if (!isVisible()) {
                setVisible(true);
            }
            setExtendedState(JFrame.NORMAL);
            toFront();
            repaint();
        });
    }

    public void restoreFromExternalRequest() {
        restoreFromTray();
    }

    private void showSettingsPlaceholder() {
        restoreFromTray();
        JOptionPane.showMessageDialog(
                this,
                "A tela de configuracoes ainda vai ser evoluida.\nPor enquanto, o painel operacional centraliza o controle do servidor.",
                "Configuracoes",
                JOptionPane.INFORMATION_MESSAGE);
    }

    private void redirectSystemStreams() {
        if (!STREAMS_REDIRECTED.compareAndSet(false, true)) {
            return;
        }

        PrintStream originalOut = System.out;
        PrintStream originalErr = System.err;
        ConsoleOutputStream consoleStream = new ConsoleOutputStream(consoleArea);

        System.setOut(new PrintStream(new TeeOutputStream(originalOut, consoleStream), true, StandardCharsets.UTF_8));
        System.setErr(new PrintStream(new TeeOutputStream(originalErr, consoleStream), true, StandardCharsets.UTF_8));
    }

    private void updateStatus(String label, Color background) {
        statusBadge.setText(label);
        statusBadge.setBackground(background);
        updateTrayTooltip(label);
    }

    private void updateDetails(String text) {
        detailsLabel.setText("Status: " + text);
    }

    private void updateButtons() {
        boolean running = applicationContext != null;
        openButton.setEnabled(running);
        startButton.setEnabled(!starting && !running);
        restartButton.setEnabled(!starting && running);
        stopButton.setEnabled(!starting && running);
    }

    private void appendLauncherMessage(String message) {
        String line = "[" + LocalDateTime.now().format(TIMESTAMP_FORMAT) + "] [launcher] " + message;
        appendConsole(line + System.lineSeparator());
    }

    private void appendConsole(String message) {
        SwingUtilities.invokeLater(() -> {
            consoleArea.append(message);
            trimConsole();
            consoleArea.setCaretPosition(consoleArea.getDocument().getLength());
        });
    }

    private void trimConsole() {
        int maxLength = 120_000;
        int currentLength = consoleArea.getDocument().getLength();
        if (currentLength <= maxLength) {
            return;
        }
        consoleArea.replaceRange("", 0, currentLength - maxLength);
    }

    private static String resolveFrontUrl(String apiBaseUrl) {
        String normalizedBase = apiBaseUrl.endsWith("/") ? apiBaseUrl.substring(0, apiBaseUrl.length() - 1) : apiBaseUrl;
        return normalizedBase + "/promocontrol/index.html";
    }

    private static Properties loadApplicationProperties() {
        Properties properties = new Properties();
        try (var input = OperationalLauncherFrame.class.getClassLoader().getResourceAsStream("application.properties")) {
            if (input != null) {
                properties.load(input);
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Nao foi possivel carregar application.properties", exception);
        }
        return properties;
    }

    private static String rootMessage(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null) {
            current = current.getCause();
        }
        return Objects.toString(current.getMessage(), current.getClass().getSimpleName());
    }

    private void updateTrayTooltip(String status) {
        if (trayIcon == null) {
            return;
        }
        trayIcon.setToolTip("PromoControl " + status + " | " + activeProfile + " | " + appVersion);
    }

    private void removeTrayIcon() {
        if (traySupported && trayIcon != null) {
            SystemTray.getSystemTray().remove(trayIcon);
        }
    }

    private static BufferedImage createWindowIcon(int size) {
        BufferedImage image = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D graphics = image.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

            float scale = size / 64f;
            graphics.scale(scale, scale);

            graphics.setPaint(new GradientPaint(3f, 3f, new Color(0x2f6df6), 61f, 61f, new Color(0x234fc0)));
            graphics.fill(new RoundRectangle2D.Float(3f, 3f, 58f, 58f, 14f, 14f));

            Path2D.Float pShape = new Path2D.Float();
            pShape.moveTo(22f, 44f);
            pShape.lineTo(22f, 20f);
            pShape.lineTo(35f, 20f);
            pShape.curveTo(41f, 20f, 46f, 24f, 46f, 30f);
            pShape.curveTo(46f, 36f, 41f, 40f, 35f, 40f);
            pShape.lineTo(28f, 40f);
            pShape.lineTo(28f, 44f);
            pShape.closePath();
            Path2D.Float pHole = new Path2D.Float();
            pHole.moveTo(28f, 34f);
            pHole.lineTo(28f, 26f);
            pHole.lineTo(34f, 26f);
            pHole.curveTo(37f, 26f, 39f, 28f, 39f, 30f);
            pHole.curveTo(39f, 32f, 37f, 34f, 34f, 34f);
            pHole.closePath();
            pShape.append(pHole, false);
            graphics.setColor(Color.WHITE);
            graphics.fill(pShape);

            Path2D.Float check = new Path2D.Float();
            check.moveTo(24f, 47f);
            check.lineTo(29f, 52f);
            check.lineTo(40f, 41f);
            graphics.setPaint(new GradientPaint(24f, 47f, new Color(0xff7a59), 40f, 41f, new Color(0xff9f5a)));
            graphics.setStroke(new BasicStroke(4f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
            graphics.draw(check);
        } finally {
            graphics.dispose();
        }
        return image;
    }

    private static final class LauncherThreadFactory implements ThreadFactory {
        @Override
        public Thread newThread(Runnable runnable) {
            Thread thread = new Thread(runnable, "promocontrol-launcher-backend");
            thread.setDaemon(false);
            return thread;
        }
    }

    private final class ConsoleOutputStream extends OutputStream {
        private final JTextArea target;
        private final StringBuilder buffer = new StringBuilder();

        private ConsoleOutputStream(JTextArea target) {
            this.target = target;
        }

        @Override
        public synchronized void write(int value) {
            char character = (char) value;
            buffer.append(character);
            if (character == '\n') {
                flushBuffer();
            }
        }

        @Override
        public synchronized void flush() {
            flushBuffer();
        }

        private void flushBuffer() {
            if (buffer.isEmpty()) {
                return;
            }
            String chunk = buffer.toString();
            buffer.setLength(0);
            SwingUtilities.invokeLater(() -> {
                target.append(chunk);
                trimConsole();
                target.setCaretPosition(target.getDocument().getLength());
            });
        }
    }

    private static final class TeeOutputStream extends OutputStream {
        private final OutputStream first;
        private final OutputStream second;

        private TeeOutputStream(OutputStream first, OutputStream second) {
            this.first = first;
            this.second = second;
        }

        @Override
        public void write(int value) throws IOException {
            first.write(value);
            second.write(value);
        }

        @Override
        public void flush() throws IOException {
            first.flush();
            second.flush();
        }
    }
}
