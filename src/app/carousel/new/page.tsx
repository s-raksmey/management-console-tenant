import { CarouselSlideForm } from "../_components/CarouselSlideForm";

export default function NewCarouselSlidePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Create Slide</h1>
        <p className="mt-2 text-sm text-slate-600">
          Add a new public homepage hero carousel slide.
        </p>
      </div>

      <CarouselSlideForm />
    </div>
  );
}
