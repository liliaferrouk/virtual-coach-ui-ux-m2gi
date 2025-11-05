import 'package:flutter/material.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';

class PosePainter extends CustomPainter {
  final List<Pose> poses;
  final Size imageSize;

  PosePainter({
    required this.poses,
    required this.imageSize,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.green
      ..strokeWidth = 4.0
      ..style = PaintingStyle.stroke;

    final pointPaint = Paint()
      ..color = Colors.red
      ..strokeWidth = 8.0
      ..strokeCap = StrokeCap.round;

    for (final pose in poses) {
      // Draw connections
      _drawLine(
        canvas,
        pose.landmarks[PoseLandmarkType.leftShoulder],
        pose.landmarks[PoseLandmarkType.rightShoulder],
        paint,
        size,
      );
      _drawLine(
        canvas,
        pose.landmarks[PoseLandmarkType.leftShoulder],
        pose.landmarks[PoseLandmarkType.leftElbow],
        paint,
        size,
      );
      _drawLine(
        canvas,
        pose.landmarks[PoseLandmarkType.leftElbow],
        pose.landmarks[PoseLandmarkType.leftWrist],
        paint,
        size,
      );
      _drawLine(
        canvas,
        pose.landmarks[PoseLandmarkType.rightShoulder],
        pose.landmarks[PoseLandmarkType.rightElbow],
        paint,
        size,
      );
      _drawLine(
        canvas,
        pose.landmarks[PoseLandmarkType.rightElbow],
        pose.landmarks[PoseLandmarkType.rightWrist],
        paint,
        size,
      );
      _drawLine(
        canvas,
        pose.landmarks[PoseLandmarkType.leftShoulder],
        pose.landmarks[PoseLandmarkType.leftHip],
        paint,
        size,
      );
      _drawLine(
        canvas,
        pose.landmarks[PoseLandmarkType.rightShoulder],
        pose.landmarks[PoseLandmarkType.rightHip],
        paint,
        size,
      );
      _drawLine(
        canvas,
        pose.landmarks[PoseLandmarkType.leftHip],
        pose.landmarks[PoseLandmarkType.rightHip],
        paint,
        size,
      );
      _drawLine(
        canvas,
        pose.landmarks[PoseLandmarkType.leftHip],
        pose.landmarks[PoseLandmarkType.leftKnee],
        paint,
        size,
      );
      _drawLine(
        canvas,
        pose.landmarks[PoseLandmarkType.leftKnee],
        pose.landmarks[PoseLandmarkType.leftAnkle],
        paint,
        size,
      );
      _drawLine(
        canvas,
        pose.landmarks[PoseLandmarkType.rightHip],
        pose.landmarks[PoseLandmarkType.rightKnee],
        paint,
        size,
      );
      _drawLine(
        canvas,
        pose.landmarks[PoseLandmarkType.rightKnee],
        pose.landmarks[PoseLandmarkType.rightAnkle],
        paint,
        size,
      );

      // Draw landmarks (points)
      for (final landmark in pose.landmarks.values) {
        final point = _translatePoint(landmark.x, landmark.y, size);
        canvas.drawCircle(point, 6, pointPaint);
      }
    }
  }

  void _drawLine(
      Canvas canvas,
      PoseLandmark? start,
      PoseLandmark? end,
      Paint paint,
      Size size,
      ) {
    if (start == null || end == null) return;

    final p1 = _translatePoint(start.x, start.y, size);
    final p2 = _translatePoint(end.x, end.y, size);

    canvas.drawLine(p1, p2, paint);
  }

  Offset _translatePoint(double x, double y, Size size) {
    // Scale coordinates to canvas size
    final scaleX = size.width / imageSize.width;
    final scaleY = size.height / imageSize.height;

    // For front camera, mirror the x coordinate
    return Offset(
      size.width - (x * scaleX),
      y * scaleY,
    );
  }

  @override
  bool shouldRepaint(covariant PosePainter oldDelegate) {
    return oldDelegate.poses != poses;
  }
}