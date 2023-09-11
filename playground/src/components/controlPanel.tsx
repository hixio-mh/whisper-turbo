import { useState, useRef, useEffect } from "react";
import {
    AvailableModels,
    ModelSizes,
    InferenceSession,
    SessionManager,
} from "whisper-turbo";
import toast from "react-hot-toast";
import { humanFileSize } from "../util";

interface ControlPanelProps {
    setText: (text: string) => void;
}

const ControlPanel = (props: ControlPanelProps) => {
    const session = useRef<InferenceSession | null>(null);
    const [selectedModel, setSelectedModel] = useState<AvailableModels | null>(
        null
    );
    const [loadedModel, setLoadedModel] = useState<AvailableModels | null>(
        null
    );
    const [audioFile, setAudioFile] = useState<Uint8Array | null>(null);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);

    const handleFileChange = (setFileState: any) => async (event: any) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setFileState(new Uint8Array(reader.result as ArrayBuffer));
        };
        reader.readAsArrayBuffer(file);
    };

    useEffect(() => {
        toast.success("Loaded model");
    }, [loaded]);

    // Somewhere in the state of your component...
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    // When the audio file is uploaded, create a new Blob URL
    useEffect(() => {
        if (audioFile) {
            const blob = new Blob([audioFile], { type: "audio/wav" }); // set type to audio type of your data
            const url = URL.createObjectURL(blob);
            setBlobUrl(url);
            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [audioFile]);

    const loadModel = async () => {
        if (session.current) {
            session.current.destroy();
        }
        if (!selectedModel) {
            console.error("No model loaded");
            return;
        }
        const manager = new SessionManager();
        const loadResult = await manager.loadModel(
            selectedModel,
            () => {
                setLoaded(true);
                setLoadedModel(selectedModel);
            },
            (p: number) => setProgress(p)
        );
        if (loadResult.isErr) {
            toast.error(loadResult.error.message);
        } else {
            session.current = loadResult.value;
        }
    };

    const runSession = async () => {
        if (!session.current) {
            toast.error("No model loaded");
            return;
        }
        if (!audioFile) {
            toast.error("No audio file loaded");
            return;
        }
        console.log("Audio file", audioFile);
        await session.current.stream(audioFile!, (decoded: string) => {
            props.setText(decoded);
        });
    };

    const displayModels = () => {
        const models = Object.values(AvailableModels);
        const sizes = Array.from(ModelSizes.values());
        const zipped = models.map((model, i) => [model, sizes[i]]);
        return zipped.map((model, idx) => (
            <li key={model[0] as string}>
                <a
                    className={`bg-orange-500 hover:bg-pop-orange py-2 px-8 font-semibold text-xl block whitespace-no-wrap cursor-pointer ${
                        idx === zipped.length - 1 ? "rounded-b-md" : ""
                    }`}
                    onClick={() => {
                        setSelectedModel(model[0] as AvailableModels);
                    }}
                >
                    {fmtModel(model[0] as AvailableModels)}{" "}
                    {humanFileSize(model[1] as number)}
                </a>
            </li>
        ));
    };

    const fmtModel = (model: AvailableModels) => {
        let name = model.split("-")[1];
        name = name.charAt(0).toUpperCase() + name.slice(1);
        return name;
    };
    return (
        <div className="flex-1 w-1/2 h-full flex flex-col relative z-10 overflow-scroll">
            <div className="h-full px-4 xl:px-16 my-4">
                <img
                    src="/whisper-turbo.png"
                    className="w-full xl:w-3/4 2xl:w-1/2 mx-auto py-8 cursor-pointer"
                    onClick={() =>
                        window.open(
                            "https://github.com/FL33TW00D/whisper-turbo",
                            "_blank"
                        )
                    }
                />
                <div className="flex flex-col mx-auto gap-8">
                    <div>
                        <div className="flex flex-row justify-between">
                            <label className="text-white text-xl font-semibold">
                                Select Model
                            </label>
                            {progress > 0 && !loaded && (
                                <label className="text-white text-xl font-semibold text-right">
                                    {progress.toFixed(2)}%
                                </label>
                            )}
                        </div>
                        <div className="group inline-block relative w-full">
                            <button className="bg-pop-orange text-white font-semibold text-xl py-2 px-8 w-full inline-flex items-center outline outline-white">
                                <span className="mr-1">
                                    {selectedModel
                                        ? fmtModel(selectedModel)
                                        : "Select Model"}
                                </span>
                                <svg
                                    className="fill-current h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                            </button>
                            <ul className="absolute hidden text-white group-hover:block z-10 w-full">
                                {displayModels()}
                            </ul>
                        </div>
                        {progress > 0 && !loaded && (
                            <div className="flex flex-col gap-2">
                                <div className="h-3 outline outline-white bg-gray-200">
                                    <div
                                        className="bg-emerald-500 h-3"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-row justify-end">
                            {selectedModel != loadedModel && (
                                <button
                                    className="text-white text-xl font-semibold"
                                    onClick={loadModel}
                                >
                                    Load
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-white text-xl font-semibold">
                            Upload Audio
                        </label>
                        <label
                            className="bg-pop-orange text-xl outline outline-white w-full text-white font-semibold py-2 px-8 mx-auto cursor-pointer"
                            htmlFor="audioFile"
                        >
                            <div className="flex flex-row justify-between ">
                                <span className="">
                                    {audioFile ? "jfk.wav" : "Select File"}
                                </span>
                                <span className="text-sm my-auto">
                                    {audioFile ? audioFile.length : ""}
                                </span>
                            </div>
                        </label>
                        <input
                            type="file"
                            className="hidden"
                            name="audioFile"
                            id="audioFile"
                            onChange={handleFileChange(setAudioFile)}
                        />
                    </div>
                </div>

                {blobUrl && (
                    <div className="flex flex-row mx-auto mt-8">
                        <audio
                            controls
                            key={blobUrl}
                            className="mx-auto relative"
                        >
                            <source
                                key={blobUrl}
                                src={blobUrl}
                                type="audio/wav"
                            />
                        </audio>
                    </div>
                )}
                <div className="flex flex-row pt-8 gap-4 mx-auto">
                    <button
                        className="bg-pop-orange text-xl outline outline-white text-white font-semibold py-2 px-6  mx-auto cursor-pointer"
                        onClick={runSession}
                    >
                        Transcribe
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ControlPanel;
