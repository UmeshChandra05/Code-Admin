import Editor from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  label?: string;
  height?: string;
  readOnly?: boolean;
  showLanguageSelector?: boolean;
}

const languageOptions = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'plaintext', label: 'Plain Text' },
];

export default function CodeEditor({
  value,
  onChange,
  language = 'python',
  label,
  height = '300px',
  readOnly = false,
  showLanguageSelector = false,
}: CodeEditorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');

  useEffect(() => {
    // Detect system theme
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(isDark ? 'vs-dark' : 'light');
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
  };

  return (
    <div className="space-y-2">
      {(label || showLanguageSelector) && (
        <div className="flex items-center justify-between">
          {label && <Label className="text-sm font-medium">{label}</Label>}
          {showLanguageSelector && (
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value} className="text-xs">
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
      <Card className="overflow-hidden border-border">
        <Editor
          height={height}
          language={selectedLanguage}
          value={value}
          onChange={handleEditorChange}
          theme={theme}
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
          }}
        />
      </Card>
    </div>
  );
}
