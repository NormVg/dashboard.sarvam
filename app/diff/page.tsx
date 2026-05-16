import { PageHeader } from "@/components/ui/PageHeader";
import { ComparePanel } from "@/components/diff/ComparePanel";
import { GitCompare, Download } from "lucide-react";
import styles from "../dashboard.module.css";

export default function DiffViewPage() {
  return (
    <div className={`${styles.workspace} flex flex-col`}>
      <PageHeader 
        title="Model Output Diff" 
        description="Compare outputs between different models or prompt iterations."
        actions={
          <>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
              <Download size={16} className="text-gray-400" />
              Export
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-full flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
              <GitCompare size={16} />
              Run Comparison
            </button>
          </>
        }
      />
      <div className="flex-1 flex overflow-hidden bg-gray-50">
        <ComparePanel 
          title="Baseline (Production)" 
          modelName="Sarvam Base" 
          content="const output = await model.generate(prompt);" 
          isChanged={true} 
        />
        <ComparePanel 
          title="Candidate (Staging)" 
          modelName="Sarvam 105B Instruct" 
          content="const output = await client.completions.create({ prompt });" 
          isChanged={true} 
        />
      </div>
    </div>
  );
}
