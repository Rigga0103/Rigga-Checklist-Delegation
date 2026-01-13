import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X, Download, ExternalLink, Maximize2 } from "lucide-react";

/**
 * QRCodeGenerator - A reusable component that generates a QR code for the current page URL
 *
 * @param {string} customUrl - Optional custom URL (if not provided, uses current window.location.href)
 * @param {string} title - Title to display in the modal
 * @param {string} description - Description text in the modal
 * @param {number} size - Size of the QR code in the modal (default: 200)
 * @param {string} position - Position of the floating button: 'top-left', 'top-right', 'bottom-left', 'bottom-right' (default: 'top-right')
 */
const QRCodeGenerator = ({
  customUrl,
  title = "Scan QR Code",
  description = "Scan this QR code with your mobile device to open this page",
  size = 200,
  position = "top-right",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const qrRef = useRef(null);

  useEffect(() => {
    // Get the current page URL or use custom URL
    if (customUrl) {
      setCurrentUrl(customUrl);
    } else {
      setCurrentUrl(window.location.href);
    }
  }, [customUrl]);

  // Position classes for the floating button
  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  // Download QR code as PNG
  const downloadQRCode = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    canvas.width = size + 40;
    canvas.height = size + 40;

    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20, size, size);

      const link = document.createElement("a");
      link.download = "qr-code.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src =
      "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  };

  return (
    <>
      {/* Floating QR Code Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${positionClasses[position]} z-40 flex items-center gap-2 px-4 py-3 text-white transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 group`}
        title="Generate QR Code for this page"
      >
        <QrCode className="w-5 h-5" />
        <span className="hidden font-medium sm:inline">QR Code</span>
        <Maximize2 className="w-4 h-4 transition-opacity opacity-0 group-hover:opacity-100" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Content */}
          <div
            className="relative w-full max-w-md p-8 bg-white shadow-2xl rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute p-2 text-gray-400 transition-colors rounded-lg top-4 right-4 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl">
                <QrCode className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
              <p className="mt-2 text-gray-500">{description}</p>
            </div>

            {/* QR Code */}
            <div
              ref={qrRef}
              className="flex items-center justify-center p-6 mx-auto mb-6 bg-white border-2 border-gray-100 rounded-2xl"
              style={{ width: size + 48, height: size + 48 }}
            >
              {currentUrl && (
                <QRCodeSVG
                  value={currentUrl}
                  size={size}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#1e1b4b"
                />
              )}
            </div>

            {/* URL Display */}
            <div className="p-3 mb-6 bg-gray-50 rounded-xl">
              <p className="mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase">
                Page URL
              </p>
              <p className="font-mono text-sm text-gray-700 break-all">
                {currentUrl}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={downloadQRCode}
                className="flex items-center justify-center flex-1 gap-2 px-4 py-3 font-semibold text-white transition-colors bg-indigo-600 rounded-xl hover:bg-indigo-700"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
              <button
                onClick={() => window.open(currentUrl, "_blank")}
                className="flex items-center justify-center flex-1 gap-2 px-4 py-3 font-semibold text-gray-700 transition-colors bg-gray-100 rounded-xl hover:bg-gray-200"
              >
                <ExternalLink className="w-5 h-5" />
                Open Link
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                Point your phone's camera at the QR code to scan
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QRCodeGenerator;
