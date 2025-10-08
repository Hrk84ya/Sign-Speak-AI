# SignSpeak AI 🤟

A professional, real-time American Sign Language (ASL) gesture recognition and translation application powered by MediaPipe AI and React.

![SignSpeak AI](https://img.shields.io/badge/SignSpeak-AI-blue?style=for-the-badge&logo=react)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-4.4.5-646CFF?style=for-the-badge&logo=vite)

## ✨ Features

- **Real-time Gesture Recognition**: Advanced hand tracking using Google's MediaPipe technology
- **Professional UI/UX**: Modern, responsive design with smooth animations and gradients
- **Live Translation**: Instant ASL gesture to text conversion
- **Text-to-Speech**: Built-in speech synthesis for translated text
- **Debug Mode**: Advanced debugging panel for troubleshooting gesture recognition
- **Session Statistics**: Track your translation session with real-time stats
- **Translation History**: Keep track of recent gestures and translations
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🎯 Supported Gestures

| Gesture | Translation | Description |
|---------|-------------|-------------|
| 👊 Fist | A | Closed fist with all fingers curled |
| ✌️ Peace | V | Index and middle fingers extended |
| 👍 Thumbs Up | Good | Thumb extended, other fingers curled |
| ✋ Open Palm | Stop | All fingers extended |
| 👉 Pointing | I | Only index finger extended |
| 🤟 L Shape | L | Thumb and index finger extended |
| 👌 OK Sign | O | Thumb and index touching, others extended |

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Modern web browser with camera access
- Good lighting conditions for optimal recognition

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Hrk84ya/Sign-Speak-AI.git
   cd signspeak-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` and grant camera permissions when prompted.

## 🛠️ Technology Stack

### Frontend
- **React 18.2.0** - Modern UI library with hooks
- **Vite 4.4.5** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

### AI & Computer Vision
- **MediaPipe Hands** - Google's hand tracking solution
- **MediaPipe Camera Utils** - Camera integration utilities
- **MediaPipe Drawing Utils** - Hand landmark visualization

### Browser APIs
- **getUserMedia API** - Camera access
- **Web Speech API** - Text-to-speech functionality
- **Canvas API** - Real-time video processing

## 📁 Project Structure

```
signspeak-ai/
├── public/
├── src/
│   ├── SignLanguageTranslator.jsx    # Main component
│   └── main.jsx                      # App entry point
├── index.html                        # HTML template
├── package.json                      # Dependencies
├── vite.config.js                   # Vite configuration
└── README.md                        # This file
```

## 🎮 How to Use

1. **Start Camera**: Click the "Start Camera" button to begin gesture recognition
2. **Position Hand**: Place your hand clearly in front of the camera
3. **Make Gestures**: Perform ASL gestures from the supported list
4. **Hold Steady**: Keep each gesture steady for 2-3 seconds for best recognition
5. **View Translation**: Watch real-time translations appear in the output panel
6. **Use Speech**: Click the "Speak" button to hear translations aloud
7. **Debug Mode**: Toggle debug mode (🔧) to troubleshoot recognition issues

## 🔧 Debug Mode

The application includes a comprehensive debug panel that shows:

- **Thumb State**: Whether the thumb is extended or curled
- **Finger States**: Individual finger extension/curl status
- **Finger Counts**: Total extended and curled finger counts
- **Recognition Logic**: Real-time gesture classification process

To enable debug mode, click the `{}` button in the navigation bar.

## 📊 Performance Optimization

- **Efficient Rendering**: Optimized canvas drawing and video processing
- **Memory Management**: Proper cleanup of camera streams and animations
- **Gesture Buffering**: Smooth recognition with confidence thresholds
- **Responsive Updates**: Real-time UI updates without blocking

## 🔒 Privacy & Security

- **Local Processing**: All gesture recognition happens locally in your browser
- **No Data Storage**: No personal data or video is stored or transmitted
- **Camera Permissions**: Requires explicit user consent for camera access
- **Secure Context**: Works only over HTTPS in production

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

**Camera not working?**
- Ensure camera permissions are granted
- Check if another application is using the camera
- Try refreshing the page

**Gestures not recognized?**
- Ensure good lighting conditions
- Keep hand clearly visible in frame
- Hold gestures steady for 2-3 seconds
- Use debug mode to check finger detection

**Poor recognition accuracy?**
- Adjust camera angle and distance
- Ensure hand is centered in frame
- Check for background interference
- Verify gesture matches reference guide

## 📈 Roadmap

- [ ] **Enhanced Gesture Set**: Add more ASL alphabet letters
- [ ] **Word Recognition**: Support for common ASL words and phrases
- [ ] **Multiple Hands**: Two-hand gesture recognition
- [ ] **Custom Gestures**: User-defined gesture training
- [ ] **Mobile App**: React Native version
- [ ] **Offline Mode**: Local model deployment
- [ ] **Multi-language**: Support for other sign languages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google MediaPipe Team** - For the amazing hand tracking technology
- **React Team** - For the excellent UI library
- **Tailwind CSS** - For the utility-first CSS framework
- **ASL Community** - For inspiration and gesture references

## 📞 Support

If you encounter any issues or have questions:

- 📧 Email: hrk84ya@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/Hrk84ya/Sign-Speak-AI/issues)

---
*SignSpeak AI - Breaking down communication barriers with technology*