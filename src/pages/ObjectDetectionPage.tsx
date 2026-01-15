
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
import { useI18n } from '@/hooks/useI18n';

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
  const { t, isRTL } = useI18n();
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
      toast({ title: t('visionAI.toasts.detectionSuccess') });
      drawDetections(data.detections);
    },
    onError: () => {
      toast({ title: t('visionAI.toasts.detectionError'), variant: 'destructive' });
    },
  });

  const segmentationMutation = useMutation({
    mutationFn: (imageFile: File) => segmentImage(imageFile),
    onSuccess: (data) => {
      setSegmentations(data.segmentations);
      toast({ title: t('visionAI.toasts.segmentationSuccess') });
      drawSegmentations(data.segmentations);
    },
    onError: () => {
      toast({ title: t('visionAI.toasts.segmentationError'), variant: 'destructive' });
    },
  });

  const poseMutation = useMutation({
    mutationFn: (imageFile: File) => estimatePose(imageFile),
    onSuccess: (data) => {
      setPoses(data.poses);
      toast({ title: t('visionAI.toasts.poseSuccess') });
      drawPoses(data.poses);
    },
    onError: () => {
      toast({ title: t('visionAI.toasts.poseError'), variant: 'destructive' });
    },
  });

  const trackingMutation = useMutation({
    mutationFn: (videoFile: File) => trackObjects(videoFile),
    onSuccess: (data) => {
      setTracks(data.tracks);
      toast({ title: t('visionAI.toasts.trackingSuccess') });
    },
    onError: () => {
      toast({ title: t('visionAI.toasts.trackingError'), variant: 'destructive' });
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
          <label htmlFor="file" className="text-sm font-medium dark:text-gray-300">{accept === 'image/*' ? t('visionAI.uploadImage') : t('visionAI.uploadVideo')}</label>
          {file ? (
            <div className={`flex items-center justify-between w-full h-32 border-2 border-dashed rounded-xl bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700/50 px-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                  {accept === 'image/*' ?
                    <ImageIcon className="w-6 h-6 text-white" /> :
                    <Video className="w-6 h-6 text-white" />
                  }
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{file.name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                <X className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
                <label htmlFor="file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900/50 hover:bg-violet-50 dark:hover:bg-violet-900/20 border-slate-300 dark:border-slate-600 hover:border-violet-300 dark:hover:border-violet-700/50 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 mb-3">
                          <Upload className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                        </div>
                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400"><span className="font-semibold text-violet-600 dark:text-violet-400">{t('visionAI.clickToUpload')}</span> {t('visionAI.orDragDrop')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{accept === 'image/*' ? t('visionAI.imageFormats') : t('visionAI.videoFormats')}</p>
                    </div>
                    <Input id="file" type="file" className="hidden" onChange={handleFileChange} accept={accept} />
                </label>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all"
            disabled={isLoading || !file}
          >
            {isLoading ? (
              <>
                <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('visionAI.processing')}
              </>
            ) : (
              <>
                <Scan className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {accept === 'image/*' ? t('visionAI.processImage') : t('visionAI.processVideo')}
              </>
            )}
          </Button>
          <Button type="button" variant="outline" className="flex-1 rounded-xl dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 hover:border-violet-300 hover:bg-violet-50 dark:hover:border-violet-700 dark:hover:bg-violet-900/30 transition-colors" onClick={handleDemo}>
            <PlayCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {t('visionAI.tryDemo')}
          </Button>
        </div>
      </form>
    );
  };

  const renderResult = () => {
    if (activeTab === 'object-tracking') {
      return tracks.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <Card className="rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800/90 overflow-hidden">
            <CardHeader className="border-b border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-800 dark:to-slate-900/80">
              <CardTitle className={`flex items-center gap-3 dark:text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40">
                  <List className="h-5 w-5 text-violet-600 dark:text-violet-400"/>
                </div>
                {t('visionAI.trackingResult')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {tracks.map(track => (
                  <li key={track.track_id} className={`flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/60 hover:shadow-lg hover:shadow-violet-500/5 hover:border-violet-200 dark:hover:border-violet-700/50 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/25">
                      <span className="text-sm font-bold text-white">{track.track_id}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold dark:text-white">{track.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
                            style={{ width: `${track.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-violet-600 dark:text-violet-400">{(track.confidence * 100).toFixed(1)}%</span>
                      </div>
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
        <Card className="rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800/90 overflow-hidden">
          <CardHeader className="border-b border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-800 dark:to-slate-900/80">
            <CardTitle className={`flex items-center gap-3 dark:text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40">
                {activeTab === 'object-detection' && <Scan className="h-5 w-5 text-violet-600 dark:text-violet-400"/>}
                {activeTab === 'image-segmentation' && <ImageIcon className="h-5 w-5 text-violet-600 dark:text-violet-400"/>}
                {activeTab === 'pose-estimation' && <Eye className="h-5 w-5 text-violet-600 dark:text-violet-400"/>}
              </div>
              {t('visionAI.result')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-xl overflow-auto max-h-[600px] border border-slate-200/80 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50 shadow-inner">
              <canvas ref={canvasRef} className="w-full h-auto" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-all" />
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl shadow-violet-500/25">
            <Eye className="h-8 w-8 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            {t('visionAI.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('visionAI.subtitle')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <Card className="rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800/90 h-full overflow-hidden">
            <CardHeader className="border-b border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-800 dark:to-slate-900/80">
              <CardTitle className={`dark:text-white flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40">
                  <Eye className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                {t('visionAI.controls')}
              </CardTitle>
              <CardDescription className="dark:text-gray-400">{t('visionAI.selectFeature')}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="object-detection" onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl mb-6 h-auto">
                  <TabsTrigger
                    value="object-detection"
                    className="rounded-lg py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/25 dark:text-gray-400 transition-all"
                  >
                    {t('visionAI.detection')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="image-segmentation"
                    className="rounded-lg py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/25 dark:text-gray-400 transition-all"
                  >
                    {t('visionAI.segmentation')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="pose-estimation"
                    className="rounded-lg py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/25 dark:text-gray-400 transition-all"
                  >
                    {t('visionAI.pose')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="object-tracking"
                    className="rounded-lg py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/25 dark:text-gray-400 transition-all"
                  >
                    {t('visionAI.tracking')}
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
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 p-16">
                <div className="text-center">
                  <div className="relative mb-6 mx-auto w-fit">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full blur-xl opacity-30" />
                    <div className="relative w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl shadow-violet-500/25">
                      <Eye className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('visionAI.noResultsYet')}</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    {t('visionAI.uploadToAnalyze')}
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
