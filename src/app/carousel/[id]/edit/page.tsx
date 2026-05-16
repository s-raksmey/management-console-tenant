"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import { CarouselSlide, Q_HOME_CAROUSEL_SLIDES } from "@/services/carousel.gql";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CarouselSlideForm } from "../../_components/CarouselSlideForm";

export default function EditCarouselSlidePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const client = useMemo(() => getAuthenticatedGqlClient(), []);
  const [slide, setSlide] = useState<CarouselSlide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSlide = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await client.request<{
          homeCarouselSlides: CarouselSlide[];
        }>(Q_HOME_CAROUSEL_SLIDES);
        const selectedSlide =
          response.homeCarouselSlides.find((item) => item.id === id) ?? null;

        if (!isMounted) return;

        if (!selectedSlide) {
          setError("Carousel slide was not found.");
          setSlide(null);
          return;
        }

        setSlide(selectedSlide);
      } catch (err: any) {
        if (!isMounted) return;
        setError(
          err?.response?.errors?.[0]?.message ||
            "Failed to load carousel slide.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadSlide();

    return () => {
      isMounted = false;
    };
  }, [client, id]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading slide...
        </CardContent>
      </Card>
    );
  }

  if (error || !slide) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-4 text-xl font-semibold text-slate-950">
            Unable to Load Slide
          </h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Button className="mt-5" asChild>
            <a href="/carousel">Back to Carousel</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Edit Slide</h1>
        <p className="mt-2 text-sm text-slate-600">
          Update the homepage hero slide content and image.
        </p>
      </div>

      <CarouselSlideForm slide={slide} />
    </div>
  );
}
