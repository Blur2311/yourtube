"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { videoUpdateSchema } from "@/db/schema";
import { trpc } from "@/trpc/client";
import { CopyCheckIcon, CopyIcon, Globe2Icon, ImagePlusIcon, Loader2Icon, LockIcon, MoreVerticalIcon, RotateCcwIcon, SparkleIcon, TrashIcon } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { VideoPlayer } from "@/modules/videos/ui/components/video-player";
import Link from "next/link";
import { snakeCaseToTitle } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { APP_URL, THUMBNAIL_FALLBACK } from "@/constants";
import { ThumbnailUploadModal } from "../components/thumbnail-upload-modal";
import { ThumbnailGenerateModal } from "../components/thumbnail-generate-modal";
import { Skeleton } from "@/components/ui/skeleton";

interface FormSectionProps {
  videoId: string;
}

export const FormSection = ({ videoId }: FormSectionProps) => {
   return (   
      <Suspense fallback={<FormSectionSkeleton/>}>
        <ErrorBoundary fallback={<div>Error...</div>}>
          <FormSectionSuspense videoId={videoId} />
        </ErrorBoundary>
      </Suspense>
    )
}

const FormSectionSkeleton = () => {
  return (
    <div className="">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32"/>
          <Skeleton className="h-4 w-40"/>
        </div>
        <Skeleton className="h-9 w-24"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="space-y-8 lg:col-span-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-16"/>
            <Skeleton className="h-10 w-full"/>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-24"/>
            <Skeleton className="h-[220px] w-full"/>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20"/>
            <Skeleton className="h-[84px] w-[153px]"/>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20"/>
            <Skeleton className="h-10 w-full"/>
          </div>
        </div>
        <div className="flex flex-col gap-y-8 lg:col-span-2">
          <div className="flex flex-col gap-4 bg-[#F9F9F9] rounded-xl overflow-hidden">
            <Skeleton className="aspect-video"/>
            <div className="p-4 space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20"/>
                <Skeleton className="h-5 w-full"/>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24"/>
                <Skeleton className="h-5 w-32"/>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24"/>
                <Skeleton className="h-5 w-32"/>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20"/>
            <Skeleton className="h-10 w-full"/>
          </div>
        </div>
      </div>
    </div>
  )
}

const FormSectionSuspense = ({ videoId }: FormSectionProps) => {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);
  const [thumbnailGenerateModalOpen, setThumbnailGenerateModalOpen] = useState(false);

  const [video] = trpc.studio.getOne.useSuspenseQuery({ id: videoId });
  const [categories] = trpc.categories.getMany.useSuspenseQuery();

  

  const update = trpc.videos.update.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      utils.studio.getOne.invalidate({ id: videoId });
      toast.success("Video updated successfully");
    },
    onError: () => {
      toast.error("Error updating video");
    }
  });

  const remove = trpc.videos.remove.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();      
      toast.success("Video removed successfully");
      router.push("/studio");
    },
    onError: () => {
      toast.error("Error removing video");
    }
  });

  const revalidate = trpc.videos.revalidate.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();      
      utils.studio.getOne.invalidate({ id: videoId });      
      toast.success("Video revalidated successfully");
      router.push("/studio");
    },
    onError: () => {
      toast.error("Error removing video");
    }
  });

  const restoreThumbnail = trpc.videos.restoreThumbnail.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();      
      utils.studio.getOne.invalidate({ id: videoId });      
      toast.success("Thumbnail restore successfully");      
    },
    onError: () => {
      toast.error("Error restore video thumbnail");
    }
  });

   const generateTitle = trpc.videos.generateTitle.useMutation({
    onSuccess: () => {
      toast.success("Background job started", {
        description: "We will notify you when the thumbnail is ready",});      
    },
    onError: () => {
      toast.error("Error");
    }
  });

  const generateDescription = trpc.videos.generateDescription.useMutation({
    onSuccess: () => {
      toast.success("Background job started", {
        description: "We will notify you when the thumbnail is ready",});      
    },
    onError: () => {
      toast.error("Error");
    }
  });

  const form = useForm<z.infer<typeof videoUpdateSchema>>({
    resolver: zodResolver(videoUpdateSchema),
    defaultValues: video,
  })

  const onSubmit =  (data: z.infer<typeof videoUpdateSchema>) => {
    update.mutate(data);
  }

  // Change if deploying outside of Vercel
  const fullUrl = `${APP_URL}/videos/${video.id}`;
  const [isCopied, setIsCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  }

  return (
    <>
      <ThumbnailUploadModal videoId={video.id} open={thumbnailModalOpen} onOpenChange={setThumbnailModalOpen} />
      <ThumbnailGenerateModal videoId={video.id} open={thumbnailGenerateModalOpen} onOpenChange={setThumbnailGenerateModalOpen} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex items-center justify-between mb-6">
            <div className="">
              <h1 className="text-2xl font-bold">Video details</h1>
              <p className="text-xs text-muted-foreground">Manage your video details</p>
            </div>
            <div className="flex items-center gap-x-2">
              <Button type="submit" disabled={update.isPending || !form.formState.isDirty}>Save</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={"ghost"} size={"icon"}>
                    <MoreVerticalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => revalidate.mutate({ id: video.id })}>
                    <RotateCcwIcon className="size-4 mr-2" />
                    Revalidate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => remove.mutate({ id: video.id })}>
                    <TrashIcon className="size-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="space-y-8 lg:col-span-3">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className="flex items-center gap-x-2">
                        Title
                        <Button 
                          size={"icon"} 
                          variant={"outline"} 
                          type="button" 
                          className="rounded-full size-6 [&_svg]:size-3"
                          onClick={() => generateTitle.mutate({ id: video.id })}
                          disabled={generateTitle.isPending  || !video.muxTrackId}
                        >
                          {generateTitle.isPending ? <Loader2Icon className="animate-spin"/> : <SparkleIcon />}
                        </Button>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="Add a title to your video"                      
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className="flex items-center gap-x-2">
                        Desciption
                        <Button 
                          size={"icon"} 
                          variant={"outline"} 
                          type="button" 
                          className="rounded-full size-6 [&_svg]:size-3"
                          onClick={() => generateDescription.mutate({ id: video.id })}
                          disabled={generateDescription.isPending || !video.muxTrackId}
                        >
                          {generateDescription.isPending ? <Loader2Icon className="animate-spin"/> : <SparkleIcon />}
                        </Button>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        value={field.value || ""}
                        rows={10}
                        className="resize-none pr-10"
                        placeholder="Add a description to your video"                      
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Add thumbnail */}
              <FormField
                name="thumbnailUrl"
                control={form.control}
                render={() => (
                  <FormItem>
                    <FormLabel>Thumbnail</FormLabel>
                    <FormControl>
                      <div className="p-0.5 border border-dashed border-neutral-400 relative h-[84px] w-[153px] group">
                        <Image 
                          src={video.thumbnailUrl || THUMBNAIL_FALLBACK} 
                          fill 
                          alt="Thumbnail" 
                          className="object-cover"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              type="button"  
                              size={"icon"} 
                              className="bg-black/50 hover:bg-black/50 absolute top-1 right-1 rounded-full 
                              opacity-100 md:opacity-0 group-hover:opacity-100 duration-300 size-7"
                            >
                              <MoreVerticalIcon className="text-white" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" side="right">
                            <DropdownMenuItem onClick={() => setThumbnailModalOpen(true)}>
                              <ImagePlusIcon className="size-4 mr-1"/>
                              Change
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setThumbnailGenerateModalOpen(true)}>
                              <SparkleIcon className="size-4 mr-1"/>
                              AI-generated
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => restoreThumbnail.mutate({ id: video.id })}>
                              <RotateCcwIcon className="size-4 mr-1"/>
                              Restore
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-y-8 lg:col-span-2">
              <div className="flex flex-col gap-4 bg-[#F9F9F9] rounded-xl overflow-hidden h-fit">
                <div className="aspect-video overflow-hidden relative">
                  <VideoPlayer
                    playbackId={video.muxPlaybackId}
                    thumbnailUrl={video.thumbnailUrl}
                  />
                </div>
                <div className="p-4 flex flex-col gap-y-6">
                  <div className="flex justify-between items-center gap-x-2">
                    <div className="flex flex-col gap-y-1">
                      <p className="text-muted-foreground text-xs">
                        Video link
                      </p>
                      <div className="flex items-center gap-x-2">
                        <Link prefetch href={`/videos/${video.id}`}>
                          <p className="line-clamp-1 text-sm text-blue-500">{fullUrl}</p>
                        </Link>
                        <Button 
                          type="button" 
                          variant={"ghost"} 
                          size={"icon"} 
                          className="shrink-0"
                          onClick={onCopy}
                          disabled={isCopied}
                        >
                          {isCopied ? <CopyCheckIcon/> : <CopyIcon />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-y-1">
                      <p className="text-muted-foreground text-xs">Video status</p>
                      <p className="text-sm">{snakeCaseToTitle(video.muxStatus || 'Preparing')}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-y-1">
                      <p className="text-muted-foreground text-xs">Subtitles status</p>
                      <p className="text-sm">{snakeCaseToTitle(video.muxTrackStatus || 'no subtitles')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={"public"}>
                          <div className="flex items-center">
                            <Globe2Icon className="size-4 mr-2"/>
                            Public    
                          </div>
                        </SelectItem>
                        <SelectItem value={"private"}>
                          <div className="flex items-center">
                            <LockIcon className="size-4 mr-2"/>
                            Private    
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </>
  )
}