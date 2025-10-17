
import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { detectObjects, segmentImage, estimatePose, trackObjects } from '@/services/objectDetectionService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon, Video, List, PlayCircle, X, Eye, Loader2, Scan } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Detection {
  label: string;
  confidence: number;
  box: [number, number, number, number];
}

interface Segmentation extends Detection {
  mask: number[][];
}

interface Pose {
  keypoints: number[][];
}

interface Track extends Detection {
  track_id: number;
}

const ObjectDetectionPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [segmentations, setSegmentations] = useState<Segmentation[]>([]);
  const [poses, setPoses] = useState<Pose[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState("object-detection");

  const detectionMutation = useMutation({
    mutationFn: (imageFile: File) => detectObjects(imageFile),
    onSuccess: (data) => {
      setDetections(data.detections);
      toast({ title: 'Object detection successful!' });
      drawDetections(data.detections);
    },
    onError: () => {
      toast({ title: 'Error detecting objects', variant: 'destructive' });
    },
  });

  const segmentationMutation = useMutation({
    mutationFn: (imageFile: File) => segmentImage(imageFile),
    onSuccess: (data) => {
      setSegmentations(data.segmentations);
      toast({ title: 'Image segmentation successful!' });
      drawSegmentations(data.segmentations);
    },
    onError: () => {
      toast({ title: 'Error segmenting image', variant: 'destructive' });
    },
  });

  const poseMutation = useMutation({
    mutationFn: (imageFile: File) => estimatePose(imageFile),
    onSuccess: (data) => {
      setPoses(data.poses);
      toast({ title: 'Pose estimation successful!' });
      drawPoses(data.poses);
    },
    onError: () => {
      toast({ title: 'Error estimating pose', variant: 'destructive' });
    },
  });

  const trackingMutation = useMutation({
    mutationFn: (videoFile: File) => trackObjects(videoFile),
    onSuccess: (data) => {
      setTracks(data.tracks);
      toast({ title: 'Object tracking successful!' });
    },
    onError: () => {
      toast({ title: 'Error tracking objects', variant: 'destructive' });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setDetections([]);
      setSegmentations([]);
      setPoses([]);
      setTracks([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      if (activeTab === "object-detection") {
        detectionMutation.mutate(file);
      } else if (activeTab === "image-segmentation") {
        segmentationMutation.mutate(file);
      } else if (activeTab === "pose-estimation") {
        poseMutation.mutate(file);
      } else if (activeTab === "object-tracking") {
        trackingMutation.mutate(file);
      }
    }
  };

  const handleDemo = async () => {
    const demoImageUrl = 'https://ultralytics.com/images/bus.jpg';
    const proxyUrl = `/api/v1/object-detection/image-proxy?url=${encodeURIComponent(demoImageUrl)}`;
    const response = await fetch(proxyUrl);
    const blob = await response.blob();
    const demoFile = new File([blob], 'bus.jpg', { type: 'image/jpeg' });
    setFile(demoFile);
    setPreviewUrl(URL.createObjectURL(demoFile));
    setDetections([]);
    setSegmentations([]);
    setPoses([]);
    setTracks([]);
    if (activeTab === "object-detection") {
      detectionMutation.mutate(demoFile);
    } else if (activeTab === "image-segmentation") {
      segmentationMutation.mutate(demoFile);
    } else if (activeTab === "pose-estimation") {
      poseMutation.mutate(demoFile);
    }
  };

  const drawDetections = (detections: Detection[]) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context && previewUrl) {
      const img = new Image();
      img.src = previewUrl;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        detections.forEach(detection => {
          const [x1, y1, x2, y2] = detection.box;
          context.strokeStyle = '#10B981';
          context.lineWidth = 2;
          context.strokeRect(x1, y1, x2 - x1, y2 - y1);
          context.fillStyle = '#10B981';
          context.fillText(`${detection.label} (${detection.confidence.toFixed(2)})`, x1, y1 - 5);
        });
      };
    }
  };

  const drawSegmentations = (segmentations: Segmentation[]) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context && previewUrl) {
      const img = new Image();
      img.src = previewUrl;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        segmentations.forEach(segmentation => {
          const { mask, box, label, confidence } = segmentation;
          const [x1, y1, x2, y2] = box;
          context.strokeStyle = '#3B82F6';
          context.lineWidth = 2;
          context.strokeRect(x1, y1, x2 - x1, y2 - y1);
          context.fillStyle = '#3B82F6';
          context.fillText(`${label} (${confidence.toFixed(2)})`, x1, y1 - 5);

          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = img.width;
          maskCanvas.height = img.height;
          const maskContext = maskCanvas.getContext('2d');
          if (maskContext) {
            const maskImageData = maskContext.createImageData(img.width, img.height);
            for (let i = 0; i < mask.length; i++) {
              for (let j = 0; j < mask[i].length; j++) {
                const index = (i * mask[i].length + j) * 4;
                if (mask[i][j] > 0) {
                  maskImageData.data[index] = 59; // R
                  maskImageData.data[index + 1] = 130;   // G
                  maskImageData.data[index + 2] = 246;   // B
                  maskImageData.data[index + 3] = 100; // A
                }
              }
            }
            maskContext.putImageData(maskImageData, 0, 0);
            context.drawImage(maskCanvas, 0, 0);
          }
        });
      };
    }
  };

  const drawPoses = (poses: Pose[]) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context && previewUrl) {
      const img = new Image();
      img.src = previewUrl;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        poses.forEach(pose => {
          pose.keypoints.forEach(keypoint => {
            const [x, y, conf] = keypoint;
            if (conf > 0.5) {
              context.beginPath();
              context.arc(x, y, 5, 0, 2 * Math.PI);
              context.fillStyle = '#F59E0B';
              context.fill();
            }
          });
        });
      };
    }
  };

  const renderForm = (accept: string) => {
    const isLoading = detectionMutation.isPending || segmentationMutation.isPending || poseMutation.isPending || trackingMutation.isPending;

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="file" className="text-sm font-medium dark:text-gray-300">Upload {accept === 'image/*' ? 'Image' : 'Video'}</label>
          {file ? (
            <div className="flex items-center justify-between w-full h-32 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 px-6">
              <div className="flex items-center space-x-4">
                {accept === 'image/*' ?
                  <ImageIcon className="w-10 h-10 text-violet-500 dark:text-violet-400" /> :
                  <Video className="w-10 h-10 text-violet-500 dark:text-violet-400" />
                }
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{file.name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="dark:hover:bg-slate-700">
                <X className="h-5 w-5 dark:text-gray-400" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
                <label htmlFor="file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-violet-500 dark:text-violet-400" />
                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{accept === 'image/*' ? 'PNG, JPG, GIF up to 10MB' : 'MP4, AVI, MOV up to 50MB'}</p>
                    </div>
                    <Input id="file" type="file" className="hidden" onChange={handleFileChange} accept={accept} />
                </label>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            disabled={isLoading || !file}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Scan className="mr-2 h-4 w-4" />
                Process {accept === 'image/*' ? 'Image' : 'Video'}
              </>
            )}
          </Button>
          <Button type="button" variant="outline" className="flex-1 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700" onClick={handleDemo}>
            <PlayCircle className="mr-2 h-4 w-4" /> Try Demo
          </Button>
        </div>
      </form>
    );
  };

  const renderResult = () => {
    if (activeTab === 'object-tracking') {
      return tracks.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardTitle className="flex items-center dark:text-white">
                <List className="mr-2 text-violet-600 dark:text-violet-400"/>
                Tracking Result
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {tracks.map(track => (
                  <li key={track.track_id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{track.track_id}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium dark:text-white">{track.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Confidence: {(track.confidence * 100).toFixed(1)}%</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )
    }
    return previewUrl && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <CardTitle className="flex items-center dark:text-white">
              {activeTab === 'object-detection' && <Scan className="mr-2 text-violet-600 dark:text-violet-400"/>}
              {activeTab === 'image-segmentation' && <ImageIcon className="mr-2 text-violet-600 dark:text-violet-400"/>}
              {activeTab === 'pose-estimation' && <Eye className="mr-2 text-violet-600 dark:text-violet-400"/>}
              Result
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-lg overflow-auto max-h-[600px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <canvas ref={canvasRef} className="w-full h-auto" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">
          👁️ Vision AI
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Explore the power of YOLO for object detection, segmentation, pose estimation, and tracking</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 h-full">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardTitle className="dark:text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                Controls
              </CardTitle>
              <CardDescription className="dark:text-gray-400">Select a feature and upload your media</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="object-detection" onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg mb-6">
                  <TabsTrigger
                    value="object-detection"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white dark:text-gray-400"
                  >
                    Detection
                  </TabsTrigger>
                  <TabsTrigger
                    value="image-segmentation"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white dark:text-gray-400"
                  >
                    Segmentation
                  </TabsTrigger>
                  <TabsTrigger
                    value="pose-estimation"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white dark:text-gray-400"
                  >
                    Pose
                  </TabsTrigger>
                  <TabsTrigger
                    value="object-tracking"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white dark:text-gray-400"
                  >
                    Tracking
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="object-detection">{renderForm('image/*')}</TabsContent>
                <TabsContent value="image-segmentation">{renderForm('image/*')}</TabsContent>
                <TabsContent value="pose-estimation">{renderForm('image/*')}</TabsContent>
                <TabsContent value="object-tracking">{renderForm('video/*')}</TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {renderResult() || (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 p-16">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="h-10 w-10 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Results Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    Upload an image or video and process it to see AI-powered vision analysis
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export { ObjectDetectionPage };
