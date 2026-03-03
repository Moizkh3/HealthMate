import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeftIcon, CalendarIcon, DownloadIcon, FileTextIcon, HelpCircleIcon, LanguagesIcon, Share2Icon, SparklesIcon, ActivityIcon, BrainIcon, ShieldCheckIcon, ListChecksIcon, UserIcon, MessageSquareIcon, FootprintsIcon, UsersIcon, SmileIcon, Loader2 } from "lucide-react";

export default function ViewReport() {
    const navigate = useNavigate();
    const location = useLocation();

    const { id } = useParams();
    const { backendUrl } = useContext(AppContext);

    // Local state for report data
    const [reportData, setReportData] = useState(location.state || null);
    const [loading, setLoading] = useState(!location.state && id);
    const [viewMode, setViewMode] = useState("bilingual"); // en, ur, bilingual

    useEffect(() => {
        const fetchReport = async () => {
            if (!reportData && id) {
                setLoading(true);
                try {
                    const { data } = await axios.get(`${backendUrl}/api/analysis/report/${id}`);
                    if (data.success) {
                        setReportData(data.report);
                    } else {
                        toast.error(data.message);
                        navigate("/dashboard");
                    }
                } catch (error) {
                    toast.error("Failed to load report");
                    navigate("/dashboard");
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchReport();
    }, [id, backendUrl, reportData, navigate]);

    // Derived data
    const analysis = reportData?.analysis || {};
    const imageUrl = reportData?.imageUrl || "";
    const title = reportData?.title || "";
    const date = reportData?.date || "";
    const type = reportData?.type || "";

    // Helper to get text based on view mode and availability
    const getText = (field, lang = "en") => {
        if (!field) return null;
        if (typeof field === "string") return field;
        return field[lang] || field["en"] || null;
    };

    const patientInfo = analysis?.patient_info || {};
    const developmental = analysis?.developmental_status || {};
    const medicalConditions = analysis?.medical_conditions || [];
    const strengths = analysis?.strengths || [];
    const weaknesses = analysis?.weaknesses || []; // In case we add this later

    // Handler for Download (Print as PDF)
    const handleDownload = () => {
        window.print();
    };

    // Handler for Share
    const handleShare = async () => {
        const shareData = {
            title: `Medical Report: ${title || "HealthMate"}`,
            text: `Check out this health report analysis: ${title || "Medical Report"} dated ${formattedDate}`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                toast.success("Shared successfully!");
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied to clipboard!");
            }
        } catch (error) {
            console.error("Error sharing:", error);
            if (error.name !== "AbortError") {
                toast.error("Failed to share");
            }
        }
    };
    const recommendations = analysis?.recommendations || [];
    const mainSummary = analysis?.summary || {};

    const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }) : "No Date";

    // Polished Fallback Copy
    const emptyStateCopy = {
        en: "Not explicitly specified in this medical document.",
        ur: "Is medical report mein wazeh tor par beyan nahi kiya gaya."
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-gray-50">
                <Loader2 className="size-12 animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading analysis results...</p>
            </div>
        );
    }

    if (!reportData && !id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-gray-50 px-6 text-center">
                <div className="p-4 bg-white rounded-full shadow-sm mb-6">
                    <HelpCircleIcon className="size-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Report Selected</h3>
                <p className="text-gray-500 max-w-md mb-8">Please select a report from your dashboard or timeline to view the full analysis.</p>
                <Link to="/dashboard" className="bg-linear-to-b from-gray-600 to-gray-800 text-white px-8 py-3 rounded-full font-medium hover:from-gray-700 transition shadow-lg">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] bg-gray-50 px-6 py-8 lg:px-16 lg:py-12 relative overflow-x-hidden">
            {/* Print-specific Styles */}
            <style>
                {`
                    @media print {
                        .no-print { display: none !important; }
                        body { background: white !important; padding: 0 !important; margin: 0 !important; }
                        .print-container { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
                        .bg-gray-50 { background: white !important; }
                        .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl { box-shadow: none !important; border: 1px solid #eee !important; }
                        .rounded-3xl { border-radius: 12px !important; }
                    }
                `}
            </style>
            <div className="max-w-6xl mx-auto w-full">
                {/* Header/Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition">
                            <ArrowLeftIcon className="size-5 text-gray-600" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{title || "Report Analysis"}</h2>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1"><CalendarIcon className="size-3.5" /> {formattedDate}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                <span>{type || "Medical Report"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 no-print">
                        <div className="flex bg-gray-100 p-1 rounded-full mr-2">
                            <button onClick={() => setViewMode("en")} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${viewMode === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>EN</button>
                            <button onClick={() => setViewMode("ur")} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${viewMode === 'ur' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>UR</button>
                            <button onClick={() => setViewMode("bilingual")} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${viewMode === 'bilingual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>Both</button>
                        </div>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition shadow-sm text-gray-600"
                        >
                            <Share2Icon className="size-4" /> Share
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 bg-linear-to-b from-gray-600 to-gray-800 text-white px-5 py-2 rounded-full text-sm font-medium hover:from-gray-700 transition shadow-md"
                        >
                            <DownloadIcon className="size-4" /> Download PDF
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Main Analysis Column */}
                    <div className="lg:col-span-8 flex flex-col gap-8">

                        {/* 0. Big Easy Summary */}
                        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm relative overflow-hidden group border-l-4 border-l-indigo-600">
                            <div className="flex items-center gap-3 mb-6">
                                <SparklesIcon className="size-6 text-yellow-500" />
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Executive Summary</h3>
                            </div>
                            <div className="space-y-4">
                                {(viewMode === 'en' || viewMode === 'bilingual') && (
                                    <p className="text-lg text-gray-700 leading-relaxed font-medium">
                                        {getText(mainSummary, "en") || "Detailed clinical summary is being finalized by AI."}
                                    </p>
                                )}
                                {(viewMode === 'ur' || viewMode === 'bilingual') && (
                                    <p className="text-lg text-indigo-700 leading-relaxed font-semibold italic border-t border-gray-50 pt-4">
                                        {getText(mainSummary, "ur") || "Report ka khulasa taiyar kiya ja raha hai."}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 1. Primary Diagnosis Card */}
                        <div className="bg-linear-to-br from-indigo-600 to-violet-700 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 size-40 bg-white opacity-5 rounded-full blur-3xl group-hover:scale-125 transition duration-700"></div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                                    <ActivityIcon className="size-6 text-indigo-100" />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight">Primary Diagnosis</h3>
                            </div>
                            <div className="space-y-3">
                                {(viewMode === 'en' || viewMode === 'bilingual') && (
                                    <p className="text-2xl font-semibold text-white leading-snug">
                                        {getText(analysis?.primary_diagnosis, "en") || "Awaiting final clinical confirmation"}
                                    </p>
                                )}
                                {(viewMode === 'ur' || viewMode === 'bilingual') && (
                                    <p className="text-xl font-medium text-indigo-100 leading-snug italic">
                                        {getText(analysis?.primary_diagnosis, "ur") || "Tashkhees ka intezar hai."}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 2. Medical Conditions */}
                            <div className="bg-white border border-gray-100 rounded-3xl p-7 shadow-sm">
                                <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
                                    <ShieldCheckIcon className="size-5 text-red-500" />
                                    <h4 className="font-bold text-gray-900">Medical Conditions</h4>
                                </div>
                                <ul className="space-y-4">
                                    {medicalConditions.length > 0 ? medicalConditions.map((condition, idx) => (
                                        <li key={idx} className="flex flex-col gap-1 text-sm text-gray-600 bg-gray-50/50 p-3 rounded-xl border border-transparent hover:border-red-100 transition">
                                            <div className="flex gap-3">
                                                <span className="size-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                                                {(viewMode === 'en' || viewMode === 'bilingual') && <span>{getText(condition, "en")}</span>}
                                            </div>
                                            {(viewMode === 'ur' || viewMode === 'bilingual') && (
                                                <span className="text-xs text-red-700 italic ml-4.5 font-medium">{getText(condition, "ur")}</span>
                                            )}
                                        </li>
                                    )) : <li className="text-xs text-gray-400 italic px-2">{emptyStateCopy.en}</li>}
                                </ul>
                            </div>

                            {/* 3. Strengths */}
                            <div className="bg-white border border-gray-100 rounded-3xl p-7 shadow-sm">
                                <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
                                    <SparklesIcon className="size-5 text-yellow-500" />
                                    <h4 className="font-bold text-gray-900">Strengths & Capabilities</h4>
                                </div>
                                <ul className="space-y-4">
                                    {strengths.length > 0 ? strengths.map((strength, idx) => (
                                        <li key={idx} className="flex flex-col gap-1 text-sm text-gray-600 bg-gray-50/50 p-3 rounded-xl border border-transparent hover:border-green-100 transition">
                                            <div className="flex gap-3">
                                                <span className="size-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                                                {(viewMode === 'en' || viewMode === 'bilingual') && <span>{getText(strength, "en")}</span>}
                                            </div>
                                            {(viewMode === 'ur' || viewMode === 'bilingual') && (
                                                <span className="text-xs text-green-700 italic ml-4.5 font-medium">{getText(strength, "ur")}</span>
                                            )}
                                        </li>
                                    )) : <li className="text-xs text-gray-400 italic px-2">{emptyStateCopy.en}</li>}
                                </ul>
                            </div>
                        </div>

                        {/* 4. Developmental Status (Large Grid) */}
                        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
                                <BrainIcon className="size-6 text-indigo-600" />
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Developmental Status</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-6">
                                    <div className="flex gap-4 p-4 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 transition">
                                        <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                            <MessageSquareIcon className="size-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Speech & Communication</h5>
                                            {(viewMode === 'en' || viewMode === 'bilingual') && (
                                                <p className="text-sm text-gray-700 leading-relaxed font-medium">{getText(developmental.speech, "en") || emptyStateCopy.en}</p>
                                            )}
                                            {(viewMode === 'ur' || viewMode === 'bilingual') && (
                                                <p className="text-xs text-blue-700 leading-relaxed font-semibold italic mt-1">{getText(developmental.speech, "ur") || emptyStateCopy.ur}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-4 p-4 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 transition">
                                        <div className="size-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                                            <FootprintsIcon className="size-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Gross Motor Skills</h5>
                                            {(viewMode === 'en' || viewMode === 'bilingual') && (
                                                <p className="text-sm text-gray-700 leading-relaxed font-medium">{getText(developmental.gross_motor, "en") || emptyStateCopy.en}</p>
                                            )}
                                            {(viewMode === 'ur' || viewMode === 'bilingual') && (
                                                <p className="text-xs text-orange-700 leading-relaxed font-semibold italic mt-1">{getText(developmental.gross_motor, "ur") || emptyStateCopy.ur}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-6">
                                    <div className="flex gap-4 p-4 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 transition">
                                        <div className="size-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                                            <ActivityIcon className="size-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Fine Motor Skills</h5>
                                            {(viewMode === 'en' || viewMode === 'bilingual') && (
                                                <p className="text-sm text-gray-700 leading-relaxed font-medium">{getText(developmental.fine_motor, "en") || emptyStateCopy.en}</p>
                                            )}
                                            {(viewMode === 'ur' || viewMode === 'bilingual') && (
                                                <p className="text-xs text-purple-700 leading-relaxed font-semibold italic mt-1">{getText(developmental.fine_motor, "ur") || emptyStateCopy.ur}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-4 p-4 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 transition">
                                        <div className="size-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                                            <UsersIcon className="size-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Social Development</h5>
                                            {(viewMode === 'en' || viewMode === 'bilingual') && (
                                                <p className="text-sm text-gray-700 leading-relaxed font-medium">{getText(developmental.social, "en") || emptyStateCopy.en}</p>
                                            )}
                                            {(viewMode === 'ur' || viewMode === 'bilingual') && (
                                                <p className="text-xs text-green-700 leading-relaxed font-semibold italic mt-1">{getText(developmental.social, "ur") || emptyStateCopy.ur}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <div className="flex gap-4 p-4 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 transition">
                                        <div className="size-10 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0">
                                            <SmileIcon className="size-5 text-yellow-600" />
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Behavioral Observations</h5>
                                            {(viewMode === 'en' || viewMode === 'bilingual') && (
                                                <p className="text-sm text-gray-700 leading-relaxed font-medium">{getText(developmental.behavior, "en") || emptyStateCopy.en}</p>
                                            )}
                                            {(viewMode === 'ur' || viewMode === 'bilingual') && (
                                                <p className="text-xs text-yellow-700 leading-relaxed font-semibold italic mt-1">{getText(developmental.behavior, "ur") || emptyStateCopy.ur}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Side Column: Document & Recommendations */}
                    <div className="lg:col-span-4 flex flex-col gap-8">

                        {/* Recommendations Card */}
                        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8 bg-linear-to-b from-white to-gray-50/50">
                            <div className="flex items-center gap-3 mb-6">
                                <ListChecksIcon className="size-6 text-green-600" />
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Clinical Recommendations</h3>
                            </div>
                            <ul className="space-y-4">
                                {recommendations.length > 0 ? recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex flex-col gap-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-green-200 transition">
                                        <div className="flex gap-3">
                                            <span className="flex-shrink-0 size-6 flex items-center justify-center bg-green-100 rounded-full text-[10px] font-bold text-green-700">{idx + 1}</span>
                                            {(viewMode === 'en' || viewMode === 'bilingual') && <span className="text-sm text-gray-600">{getText(rec, "en")}</span>}
                                        </div>
                                        {(viewMode === 'ur' || viewMode === 'bilingual') && (
                                            <span className="text-xs text-green-700 italic ml-9 font-medium">{getText(rec, "ur")}</span>
                                        )}
                                    </li>
                                )) : <li className="text-xs text-gray-400 italic px-2">{emptyStateCopy.en}</li>}
                            </ul>
                        </div>

                        {/* Patient Profile Card (Small) */}
                        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
                                <UserIcon className="size-5 text-gray-400" />
                                <h4 className="font-bold text-gray-900">Patient Profile</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Age</span>
                                    <p className="text-lg font-bold text-gray-800">{getText(patientInfo.age) || "N/A"}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Gender</span>
                                    <p className="text-lg font-bold text-gray-800">{getText(patientInfo.gender) || "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Document Preview (Small) */}
                        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col group">
                            <div className="bg-gray-50/80 p-4 border-b border-gray-100 flex justify-between items-center group-hover:bg-gray-50 transition">
                                <div className="flex items-center gap-2">
                                    <FileTextIcon className="size-4 text-gray-500" />
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Report Image</span>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50/30">
                                {imageUrl ? (
                                    <img src={imageUrl} alt="Health Report" className="w-full h-auto object-contain rounded-xl shadow-sm hover:scale-105 transition duration-500 cursor-zoom-in" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                        <FileTextIcon className="size-12 text-gray-400 mb-2" />
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">No Document Preview</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
