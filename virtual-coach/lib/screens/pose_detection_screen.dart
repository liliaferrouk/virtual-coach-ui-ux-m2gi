import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';
import 'package:provider/provider.dart';
import '../providers/workout_provider.dart';
import '../widgets/pose_painter.dart';
import 'package:webview_flutter/webview_flutter.dart';

class PoseDetectionScreen extends StatefulWidget {
  const PoseDetectionScreen({super.key});

  @override
  State<PoseDetectionScreen> createState() => _PoseDetectionScreenState();
}

class _PoseDetectionScreenState extends State<PoseDetectionScreen> {
  CameraController? _cameraController;
  PoseDetector? _poseDetector;
  bool _isDetecting = false;
  List<Pose> _poses = [];

  String _squatStage = 'up'; // 'up' or 'down'
  double? _currentSquatKneeAngle;
  String _feedback = 'Stand in front of camera';
  Color _feedbackColor = Colors.white;

  late WebViewController _webViewController;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
    _initializePoseDetector();
    _initializeWebView();
  }

  void _initializeWebView() {
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(Uri.parse('https://www.youtube.com/embed/aclHkVaku9U?autoplay=1&mute=1&loop=1&playlist=aclHkVaku9U'));
  }

  Future<void> _initializeCamera() async {
    final cameras = await availableCameras();
    if (cameras.isEmpty) return;

    // Use front camera
    final camera = cameras.firstWhere(
          (camera) => camera.lensDirection == CameraLensDirection.front,
      orElse: () => cameras.first,
    );

    _cameraController = CameraController(
      camera,
      ResolutionPreset.high,
      enableAudio: false,
    );

    await _cameraController!.initialize();

    if (!mounted) return;

    setState(() {});
    _cameraController!.startImageStream(_processCameraImage);
  }

  void _initializePoseDetector() {
    final options = PoseDetectorOptions(
      model: PoseDetectionModel.accurate,
      mode: PoseDetectionMode.stream,
    );
    _poseDetector = PoseDetector(options: options);
  }

  Future<void> _processCameraImage(CameraImage image) async {
    if (_isDetecting || _poseDetector == null) return;
    _isDetecting = true;

    try {
      final inputImage = _convertCameraImage(image);
      if (inputImage == null) {
        _isDetecting = false;
        return;
      }

      final poses = await _poseDetector!.processImage(inputImage);
      if (mounted) {
        setState(() {
          _poses = poses;
          _analyzePose(poses);
        });
      }
    } catch (e) {
      debugPrint('Error processing image: $e');
    }

    _isDetecting = false;
  }

  InputImage? _convertCameraImage(CameraImage image) {
    final camera = _cameraController!.description;
    final sensorOrientation = camera.sensorOrientation;

    InputImageRotation? rotation;
    if (Platform.isIOS) {
      rotation = InputImageRotationValue.fromRawValue(sensorOrientation);
    } else if (Platform.isAndroid) {
      var rotationCompensation = sensorOrientation;
      if (camera.lensDirection == CameraLensDirection.front) {
        rotationCompensation = (sensorOrientation + 270) % 360;
      } else {
        rotationCompensation = (sensorOrientation + 90) % 360;
      }
      rotation = InputImageRotationValue.fromRawValue(rotationCompensation);
    }

    if (rotation == null) return null;

    final format = InputImageFormatValue.fromRawValue(image.format.raw);
    if (format == null) return null;

    if (image.planes.isEmpty) return null;

    final plane = image.planes.first;

    return InputImage.fromBytes(
      bytes: plane.bytes,
      metadata: InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: rotation,
        format: format,
        bytesPerRow: plane.bytesPerRow,
      ),
    );
  }

  void _analyzePose(List<Pose> poses) {
    if (poses.isEmpty) {
      _feedback = 'Stand in front of camera';
      _feedbackColor = Colors.white;
      return;
    }

    final pose = poses.first;
    final landmarks = pose.landmarks;

    // Get left side landmarks: hip(23), knee(25), ankle(27)
    final leftHip = landmarks[PoseLandmarkType.leftHip];
    final leftKnee = landmarks[PoseLandmarkType.leftKnee];
    final leftAnkle = landmarks[PoseLandmarkType.leftAnkle];

    if (leftHip == null || leftKnee == null || leftAnkle == null) {
      _feedback = 'Please ensure full body is visible';
      _feedbackColor = Colors.orange;
      return;
    }

    // Calculate knee angle
    final kneeAngle = _calculateAngle(
      leftHip.x, leftHip.y,
      leftKnee.x, leftKnee.y,
      leftAnkle.x, leftAnkle.y,
    );

    // Squat detection logic
    if (kneeAngle > 160) {
      // Standing position
      if (_squatStage == 'down') {
        // Complete squat - count it
        final isGoodForm = _currentSquatKneeAngle != null &&
            _currentSquatKneeAngle! < 100;
        Provider.of<WorkoutProvider>(context, listen: false)
            .addSquat(isGoodForm);
      }
      _squatStage = 'up';
      _currentSquatKneeAngle = null;
      _feedback = 'Stand ready - Go down!';
      _feedbackColor = Colors.green;
    } else if (kneeAngle < 100 && _squatStage == 'up') {
      // Deep squat - excellent form
      _squatStage = 'down';
      _currentSquatKneeAngle = kneeAngle;
      _feedback = 'Perfect! Come back up!';
      _feedbackColor = Colors.green;
    } else if (kneeAngle >= 100 && kneeAngle < 120 && _squatStage == 'up') {
      // Moderate squat - acceptable
      _squatStage = 'down';
      _currentSquatKneeAngle = kneeAngle;
      _feedback = 'Good squat! Come back up!';
      _feedbackColor = Colors.lightGreen;
    } else if (kneeAngle >= 120 && kneeAngle < 140) {
      // Transitional position
      if (_squatStage == 'up') {
        _feedback = 'Go deeper!';
        _feedbackColor = Colors.orange;
      } else {
        _feedback = 'Come back up!';
        _feedbackColor = Colors.yellow;
      }
    } else if (kneeAngle >= 140 && kneeAngle <= 160) {
      _feedback = 'Almost standing!';
      _feedbackColor = Colors.yellow;
    }
  }

  double _calculateAngle(double x1, double y1, double x2, double y2, double x3, double y3) {
    final radians = atan2(y3 - y2, x3 - x2) - atan2(y1 - y2, x1 - x2);
    double angle = (radians * 180.0 / pi).abs();
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  }

  @override
  Widget build(BuildContext context) {
    final workoutProvider = Provider.of<WorkoutProvider>(context);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    _buildCameraView(),
                    const SizedBox(height: 20),
                    _buildVideoPlayer(),
                    const SizedBox(height: 20),
                    _buildProgressCard(workoutProvider),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          const SizedBox(width: 10),
          Image.asset(
            'assets/images/logo.png',
            height: 35,
            errorBuilder: (context, error, stackTrace) {
              return const Text(
                'FIT',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCameraView() {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return Container(
        height: 300,
        margin: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: const Color(0xFF1D1E33),
          borderRadius: BorderRadius.circular(15),
        ),
        child: const Center(
          child: CircularProgressIndicator(color: Color(0xFF05667B)),
        ),
      );
    }

    return Container(
      height: 300,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: Colors.black,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(15),
        child: Stack(
          fit: StackFit.expand,
          children: [
            CameraPreview(_cameraController!),
            if (_poses.isNotEmpty)
              CustomPaint(
                painter: PosePainter(
                  poses: _poses,
                  imageSize: Size(
                    _cameraController!.value.previewSize!.height,
                    _cameraController!.value.previewSize!.width,
                  ),
                ),
              ),
            Positioned(
              top: 10,
              left: 10,
              right: 10,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _feedback,
                      style: TextStyle(
                        color: _feedbackColor,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (_poses.isNotEmpty && _poses.first.landmarks[PoseLandmarkType.leftKnee] != null)
                      Text(
                        'Knee Angle: ${_getKneeAngle().toStringAsFixed(0)}°',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  double _getKneeAngle() {
    if (_poses.isEmpty) return 0;
    final pose = _poses.first;
    final leftHip = pose.landmarks[PoseLandmarkType.leftHip];
    final leftKnee = pose.landmarks[PoseLandmarkType.leftKnee];
    final leftAnkle = pose.landmarks[PoseLandmarkType.leftAnkle];

    if (leftHip == null || leftKnee == null || leftAnkle == null) return 0;

    return _calculateAngle(
      leftHip.x, leftHip.y,
      leftKnee.x, leftKnee.y,
      leftAnkle.x, leftAnkle.y,
    );
  }

  Widget _buildVideoPlayer() {
    return Container(
      height: 200,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: Colors.black,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(15),
        child: WebViewWidget(controller: _webViewController),
      ),
    );
  }

  Widget _buildProgressCard(WorkoutProvider provider) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1D1E33),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Column(
        children: [
          const Text(
            'Squats',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            '${provider.squatCount} / ${provider.targetReps} times',
            style: const TextStyle(
              fontSize: 18,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildDonutChart(
                'Good Form',
                provider.goodPercentage,
                const Color(0xFF05667B),
                provider.goodSquats,
              ),
              _buildDonutChart(
                'Needs Work',
                provider.badPercentage,
                const Color(0xFFFF6B6B),
                provider.badSquats,
              ),
            ],
          ),
          if (provider.squatCount >= provider.targetReps) ...[
            const SizedBox(height: 20),
            const Text(
              '🎉 BRAVO! 🎉',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDonutChart(String label, double percentage, Color color, int count) {
    return Column(
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 100,
              height: 100,
              child: CircularProgressIndicator(
                value: percentage / 100,
                strokeWidth: 8,
                backgroundColor: Colors.white12,
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ),
            Column(
              children: [
                Text(
                  '${percentage.toStringAsFixed(0)}%',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  '($count)',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 10),
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _poseDetector?.close();
    super.dispose();
  }
}