import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Camera,
  FileImage,
  AlertCircle,
  Check,
  Brain
} from 'lucide-react';
import toast from 'react-hot-toast';
import aiService from '../../services/aiService';

const ImageUpload = ({
  onImagesChange = () => {},
  maxImages = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  className = ''
}) => {
  const [images, setImages] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!acceptedTypes.includes(file.type)) {
      toast.error(`File type ${file.type} is not supported. Please use JPG, PNG, or WebP.`);
      return false;
    }

    if (file.size > maxSize) {
      toast.error(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
      return false;
    }

    return true;
  };

  const processFiles = async (files) => {
    const fileArray = Array.from(files);
    
    if (images.length + fileArray.length > maxImages) {
      toast.error(`You can upload a maximum of ${maxImages} images`);
      return;
    }

    setUploading(true);

    const newImages = [];
    
    for (const file of fileArray) {
      if (!validateFile(file)) continue;

      try {
        const imageData = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          preview: URL.createObjectURL(file),
          uploaded: false,
          analyzing: true,
          aiDescription: null
        };

        newImages.push(imageData);
        
        // Start AI analysis in the background
        aiService.analyzeImage(file)
          .then(analysis => {
            setImages(prevImages => 
              prevImages.map(img => 
                img.id === imageData.id 
                  ? { 
                      ...img, 
                      analyzing: false, 
                      aiDescription: analysis.description,
                      aiAnalysis: analysis
                    }
                  : img
              )
            );
            toast.success(`🤖 AI generated description for ${file.name}`);
          })
          .catch(error => {
            console.error('AI analysis failed:', error);
            setImages(prevImages => 
              prevImages.map(img => 
                img.id === imageData.id 
                  ? { ...img, analyzing: false }
                  : img
              )
            );
          });

      } catch (error) {
        console.error('Error processing file:', error);
        toast.error(`Error processing ${file.name}`);
      }
    }

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange(updatedImages);
      toast.success(`${newImages.length} image${newImages.length !== 1 ? 's' : ''} added - analyzing with AI...`);
    }

    setUploading(false);
  };

  const removeImage = (imageId) => {
    setImages(prevImages => {
      const imageToRemove = prevImages.find(img => img.id === imageId);
      if (imageToRemove && imageToRemove.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      
      const updatedImages = prevImages.filter(img => img.id !== imageId);
      onImagesChange(updatedImages);
      return updatedImages;
    });
    
    toast.success('Image removed');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow re-selecting the same file
    e.target.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-4">
          {uploading ? (
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          ) : (
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
              {isDragOver ? (
                <Upload className="w-6 h-6 text-blue-600" />
              ) : (
                <Camera className="w-6 h-6 text-gray-400" />
              )}
            </div>
          )}

          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {uploading ? 'Processing images...' : 'Upload Images'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Drag and drop images here, or click to select files
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Supports JPG, PNG, WebP up to {Math.round(maxSize / (1024 * 1024))}MB each
            </p>
          </div>

          {images.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {images.length} of {maxImages} images selected
            </div>
          )}
        </div>
      </div>

      {/* Image Previews */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          >
            {images.map((image) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
              >
                {/* Image Preview */}
                <div className="aspect-square relative">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                  
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(image.id);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* AI Analysis Status */}
                  {image.analyzing && (
                    <div className="absolute bottom-2 left-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
                      <Brain className="w-3 h-3 animate-pulse" />
                    </div>
                  )}
                  
                  {image.aiDescription && !image.analyzing && (
                    <div className="absolute bottom-2 left-2 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center">
                      <Brain className="w-3 h-3" />
                    </div>
                  )}

                  {/* Upload Status */}
                  {image.uploaded && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Image Info */}
                <div className="p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <FileImage className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {image.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {formatFileSize(image.size)}
                  </p>
                  
                  {/* AI Description */}
                  {image.analyzing && (
                    <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                      <Brain className="w-3 h-3 animate-pulse" />
                      <span>Analyzing with AI...</span>
                    </div>
                  )}
                  
                  {image.aiDescription && !image.analyzing && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded p-2 mt-1">
                      <div className="flex items-center space-x-1 mb-1">
                        <Brain className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-medium text-purple-900 dark:text-purple-200">AI Description:</span>
                      </div>
                      <p className="text-xs text-purple-800 dark:text-purple-300">
                        {image.aiDescription}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Guidelines */}
      {images.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                Photo Guidelines
              </h4>
              <ul className="text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Take clear, well-lit photos of the issue</li>
                <li>• Include surrounding context for better location identification</li>
                <li>• Multiple angles can help provide better understanding</li>
                <li>• 🤖 AI will automatically analyze and describe your images using Gemini</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Notice */}
      {images.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-sm">
              <h4 className="font-medium text-purple-900 dark:text-purple-200">
                AI Analysis Ready
              </h4>
              <p className="text-purple-800 dark:text-purple-300">
                🤖 Your images are being analyzed with Gemini AI to generate descriptions and improve categorization.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;