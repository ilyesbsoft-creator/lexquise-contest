import UploadForm from "../components/UploadForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center">
      <UploadForm competitionCode={"LX-001"}/>
    </div>
  );
}
