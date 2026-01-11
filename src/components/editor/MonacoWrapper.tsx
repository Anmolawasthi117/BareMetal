import Editor, { OnMount } from '@monaco-editor/react'
import { useRef } from 'react'
import { useLabStore, LANGUAGE_CONFIG, Language } from '../../store/useLabStore'

interface MonacoWrapperProps {
  height?: string
  readOnly?: boolean
  decorations?: Array<{
    line: number
    content: string
    color?: string
  }>
}

export default function MonacoWrapper({ 
  height = '100%', 
  readOnly = false,
  decorations = []
}: MonacoWrapperProps) {
  const { code, setCode, language } = useLabStore()
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const decorationsRef = useRef<string[]>([])

  const config = LANGUAGE_CONFIG[language]

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Define custom dark theme
    monaco.editor.defineTheme('baremetal', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: '3b82f6', fontStyle: 'bold' },
        { token: 'string', foreground: '22c55e' },
        { token: 'number', foreground: 'f97316' },
        { token: 'type', foreground: '06b6d4' },
        { token: 'function', foreground: 'eab308' },
        { token: 'variable', foreground: 'e4e4e7' },
        { token: 'operator', foreground: 'a1a1aa' },
      ],
      colors: {
        'editor.background': '#09090b',
        'editor.foreground': '#e4e4e7',
        'editor.lineHighlightBackground': '#27272a30',
        'editor.selectionBackground': '#3b82f640',
        'editorLineNumber.foreground': '#52525b',
        'editorLineNumber.activeForeground': '#a1a1aa',
        'editorCursor.foreground': '#3b82f6',
        'editor.inactiveSelectionBackground': '#3b82f620',
        'editorIndentGuide.background1': '#27272a',
        'editorIndentGuide.activeBackground1': '#3f3f46',
        'editorBracketMatch.background': '#3b82f630',
        'editorBracketMatch.border': '#3b82f6',
      },
    })

    monaco.editor.setTheme('baremetal')

    // Apply decorations
    updateDecorations()
  }

  const updateDecorations = () => {
    if (!editorRef.current || !monacoRef.current || decorations.length === 0) return

    const monaco = monacoRef.current
    const editor = editorRef.current

    // Create decorations for price tags, etc.
    const newDecorations = decorations.map(dec => ({
      range: new monaco.Range(dec.line, 1, dec.line, 1),
      options: {
        isWholeLine: true,
        linesDecorationsClassName: 'line-decoration',
        after: {
          content: ` ${dec.content}`,
          inlineClassName: `decoration-badge ${dec.color || 'text-neon-js'}`,
        },
        glyphMarginClassName: 'glyph-margin-class',
      },
    }))

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    )
  }

  return (
    <div className="relative h-full w-full bg-void rounded-lg overflow-hidden border border-metal">
      {/* Header bar */}
      <div className="h-8 bg-void-light border-b border-metal flex items-center px-3 gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className={`ml-2 text-xs font-code text-${config.color}`}>
          {config.name} — main.{config.extension}
        </span>
        {readOnly && (
          <span className="ml-auto text-[10px] font-code text-steel uppercase">read only</span>
        )}
      </div>

      {/* Editor */}
      <div style={{ height: `calc(${height} - 32px)` }}>
        <Editor
          language={config.monacoId}
          value={code}
          onChange={(value) => !readOnly && setCode(value || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'line',
            cursorBlinking: 'phase',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            readOnly,
            padding: { top: 16 },
            automaticLayout: true,
          }}
          theme="baremetal"
        />
      </div>
    </div>
  )
}

// Language selector component
export function LanguageSelector() {
  const { language, setLanguage } = useLabStore()

  return (
    <div className="flex items-center gap-1 p-1 bg-void rounded-lg border border-metal">
      {(Object.keys(LANGUAGE_CONFIG) as Language[]).map((lang) => {
        const config = LANGUAGE_CONFIG[lang]
        const isActive = language === lang
        
        return (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`px-3 py-1.5 rounded font-code text-xs uppercase tracking-wider transition-all duration-150 ${
              isActive
                ? `bg-${config.color}/20 text-${config.color} border border-${config.color}/50`
                : 'text-steel hover:text-chrome hover:bg-metal/30 border border-transparent'
            }`}
            style={isActive ? { 
              boxShadow: `0 0 10px var(--color-${config.color}-glow)` 
            } : undefined}
          >
            {config.name}
          </button>
        )
      })}
    </div>
  )
}
