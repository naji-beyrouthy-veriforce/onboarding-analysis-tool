import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  History,
  Settings,
  BarChart3
} from 'lucide-react';

const API_URL = 'http://localhost:8000';

function App() {
  const terminalRef = useRef(null);

  // Simple file states - NO pre-upload
  const [cbxFile, setCbxFile] = useState(null);
  const [hcFile, setHcFile] = useState(null);
  // Matching ratios removed - backend uses legacy defaults (80/80)

  // Job states
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState(null);

  // Dashboard states
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'history' | 'logs'
  const [jobHistory, setJobHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    successfulJobs: 0,
    failedJobs: 0,
    totalRecordsProcessed: 0,
    averageTime: 0
  });

  const successRate =
    stats.totalJobs > 0 ? Math.round((stats.successfulJobs / stats.totalJobs) * 100) : 0;

  const lastJob = jobHistory[0];

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('jobHistory') || '[]');
    setJobHistory(savedHistory);
    updateStats();
  }, []);

  const updateStats = () => {
    const savedHistory = JSON.parse(localStorage.getItem('jobHistory') || '[]');
    const successful = savedHistory.filter(j => j.status === 'completed').length;
    const failed = savedHistory.filter(j => j.status === 'failed').length;
    const avgTime =
      savedHistory
        .filter(j => j.processingTime)
        .reduce((sum, j) => sum + j.processingTime, 0) / (successful || 1);

    setStats({
      totalJobs: savedHistory.length,
      successfulJobs: successful,
      failedJobs: failed,
      totalRecordsProcessed: 0,
      averageTime: avgTime || 0
    });
  };

  const addLog = (message, type = 'info') => {
    setLogs(prev => [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message,
        type
      },
      ...prev
    ]);
  };

  const saveJobToHistory = job => {
    const savedHistory = JSON.parse(localStorage.getItem('jobHistory') || '[]');
    const newHistory = [job, ...savedHistory].slice(0, 50);
    localStorage.setItem('jobHistory', JSON.stringify(newHistory));
    setJobHistory(newHistory);
    updateStats();
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    let interval;
    if (startTime && jobStatus?.status === 'processing') {
      interval = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [startTime, jobStatus?.status]);

  const formatTime = seconds => {
    const total = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Simple file selection - NO upload yet
  const handleFileChange = setter => e => {
    const file = e.target.files?.[0];
    if (file) {
      setter(file);
      addLog(
        `File selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        'info'
      );
    }
  };

  const pollJobStatus = useCallback(
    async id => {
      try {
        const response = await fetch(`${API_URL}/api/jobs/${id}`);
        if (!response.ok) throw new Error('Failed to fetch status');

        const data = await response.json();
        setJobStatus(data);

        if (data.status === 'processing') {
          setTimeout(() => pollJobStatus(id), 1000);
        } else if (data.status === 'completed') {
          setLoading(false);
          addLog('Job completed!', 'success');
          saveJobToHistory({
            jobId: id,
            status: 'completed',
            cbxFile: cbxFile?.name,
            hcFile: hcFile?.name,
            timestamp: new Date().toISOString(),
            processingTime: elapsedTime,
            resultFile: data.result_file
          });
        } else if (data.status === 'failed') {
          setError(data.error);
          setLoading(false);
          addLog(`Job failed: ${data.error}`, 'error');
          saveJobToHistory({
            jobId: id,
            status: 'failed',
            cbxFile: cbxFile?.name,
            hcFile: hcFile?.name,
            timestamp: new Date().toISOString(),
            processingTime: elapsedTime,
            error: data.error
          });
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
        addLog(`Error: ${err.message}`, 'error');
      }
    },
    [elapsedTime, cbxFile, hcFile]
  );

  // ONE upload when starting job
  const handleSubmit = async e => {
    e.preventDefault();

    if (!cbxFile || !hcFile) {
      setError('Please select both files');
      addLog('Error: Both files required', 'error');
      return;
    }

    setError(null);
    setLoading(true);
    setElapsedTime(0);
    setStartTime(Date.now());
    setJobStatus({
      job_id: 'uploading',
      status: 'processing',
      progress: 0,
      message: 'Uploading files...',
      created_at: new Date().toISOString()
    });

    addLog(
      `Uploading CBX: ${cbxFile.name} (${(cbxFile.size / 1024 / 1024).toFixed(2)} MB)`,
      'info'
    );
    addLog(
      `Uploading HC: ${hcFile.name} (${(hcFile.size / 1024 / 1024).toFixed(2)} MB)`,
      'info'
    );

    try {
      const formData = new FormData();
      formData.append('cbx_file', cbxFile);
      formData.append('hc_file', hcFile);
      // Matching ratios removed - backend uses legacy defaults (80/80)

      const response = await fetch(`${API_URL}/api/match`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      setJobId(data.job_id);
      setJobStatus(data);
      addLog(`Job started: ${data.job_id.substring(0, 8)}...`, 'success');
      pollJobStatus(data.job_id);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setStartTime(null);
      addLog(`Failed: ${err.message}`, 'error');
    }
  };

  const handleDownload = async () => {
    if (!jobId) return;
    try {
      addLog('Downloading results...', 'info');
      const response = await fetch(`${API_URL}/api/jobs/${jobId}/download`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = jobStatus?.result_file || 'results.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addLog('Downloaded successfully', 'success');
    } catch (err) {
      addLog(`Download failed: ${err.message}`, 'error');
    }
  };

  const handleReset = () => {
    setCbxFile(null);
    setHcFile(null);
    setJobId(null);
    setJobStatus(null);
    setError(null);
    setLoading(false);
    setElapsedTime(0);
    setStartTime(null);
    addLog('Reset', 'info');
  };

  // show newest logs at the bottom
  const orderedLogs = [...logs].reverse().slice(0, 200);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* HEADER */}
      <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 rounded-xl shadow-lg shadow-blue-500/30">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-50">Onboarding Analysis Tool</h1>
              <p className="text-xs text-slate-400">Created by System Support</p>
            </div>

            {jobStatus && (
              <span
                className={`ml-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  jobStatus.status === 'completed'
                    ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/40'
                    : jobStatus.status === 'failed'
                    ? 'bg-red-900/40 text-red-300 border border-red-500/40'
                    : 'bg-sky-900/40 text-sky-300 border border-sky-500/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current mr-2" />
                {jobStatus.status.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-400">Total Jobs</p>
              <p className="text-xl font-bold text-slate-50">{stats.totalJobs}</p>
            </div>

            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-400">Success Rate</p>
              <p className="text-xl font-bold text-emerald-400">{successRate}%</p>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* OVERVIEW CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Total Jobs</p>
              <p className="mt-2 text-2xl font-bold text-slate-50">{stats.totalJobs}</p>
            </div>
            <div className="p-3 rounded-full bg-slate-800">
              <FileSpreadsheet className="h-5 w-5 text-sky-400" />
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Successful</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">{stats.successfulJobs}</p>
              <p className="text-xs text-slate-400 mt-1">{successRate}% success</p>
            </div>
            <div className="p-3 rounded-full bg-emerald-900/40">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Failed</p>
              <p className="mt-2 text-2xl font-bold text-red-400">{stats.failedJobs}</p>
            </div>
            <div className="p-3 rounded-full bg-red-900/40">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Avg Processing Time
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-50">
                {stats.averageTime ? formatTime(stats.averageTime) : '--:--'}
              </p>
              {lastJob && (
                <p className="text-xs text-slate-400 mt-1">
                  Last: {lastJob.processingTime ? formatTime(lastJob.processingTime) : 'N/A'}
                </p>
              )}
            </div>
            <div className="p-3 rounded-full bg-indigo-900/40">
              <Clock className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
        </section>

        {/* MAIN GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: main workspace */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/80 rounded-2xl shadow-lg border border-slate-800">
              {/* Tabs */}
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'upload'
                      ? 'text-sky-400 border-b-2 border-sky-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  <span>New Upload</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'text-sky-400 border-b-2 border-sky-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <History className="h-4 w-4" />
                  <span>History</span>
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'logs'
                      ? 'text-sky-400 border-b-2 border-sky-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Logs</span>
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'upload' && (
                  <div>
                    {!jobStatus ? (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-slate-100 mb-3">
                              CBX Database
                            </label>
                            <div className="relative border-2 border-dashed border-slate-700 rounded-xl p-8 hover:border-sky-500 transition-all bg-slate-900">
                              <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange(setCbxFile)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <div className="text-center">
                                {cbxFile ? (
                                  <CheckCircle className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
                                ) : (
                                  <FileText className="mx-auto h-12 w-12 text-sky-400 mb-3" />
                                )}
                                <p className="text-sm font-medium text-slate-100 mb-1">
                                  {cbxFile ? cbxFile.name : 'Click to select CBX Database file'}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {cbxFile
                                    ? `${(cbxFile.size / 1024 / 1024).toFixed(2)} MB`
                                    : 'CSV, XLSX, or XLS'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-100 mb-3">
                              Hiring Client List
                            </label>
                            <div className="relative border-2 border-dashed border-slate-700 rounded-xl p-8 hover:border-sky-500 transition-all bg-slate-900">
                              <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange(setHcFile)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <div className="text-center">
                                {hcFile ? (
                                  <CheckCircle className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
                                ) : (
                                  <Upload className="mx-auto h-12 w-12 text-indigo-400 mb-3" />
                                )}
                                <p className="text-sm font-medium text-slate-100 mb-1">
                                  {hcFile ? hcFile.name : 'Click to select HC List file'}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {hcFile
                                    ? `${(hcFile.size / 1024 / 1024).toFixed(2)} MB`
                                    : 'CSV, XLSX, or XLS'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                          <p className="text-sm text-slate-400 flex items-center">
                            <Settings className="h-4 w-4 mr-2 text-slate-500" />
                            Using legacy matching defaults: Company 80%, Address 80%
                          </p>
                        </div>

                        {error && (
                          <div className="bg-red-900/40 border-l-4 border-red-500 rounded-lg p-4 flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                            <div className="text-sm text-red-200">{error}</div>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={loading || !cbxFile || !hcFile}
                          className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white py-4 px-6 rounded-xl
                          font-semibold hover:from-sky-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-600
                          disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all shadow-lg shadow-sky-900/40"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="h-5 w-5 animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-5 w-5" />
                              <span>Start Matching</span>
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="text-center">
                          {jobStatus.status === 'completed' ? (
                            <CheckCircle className="mx-auto h-20 w-20 text-emerald-400 mb-4" />
                          ) : jobStatus.status === 'failed' ? (
                            <AlertCircle className="mx-auto h-20 w-20 text-red-400 mb-4" />
                          ) : (
                            <RefreshCw className="mx-auto h-20 w-20 text-sky-400 animate-spin mb-4" />
                          )}
                          <h3 className="text-2xl font-bold text-slate-50 mb-2">
                            {jobStatus.status === 'completed' && 'Complete!'}
                            {jobStatus.status === 'failed' && 'Failed'}
                            {jobStatus.status === 'processing' && 'Processing...'}
                          </h3>
                          <p className="text-slate-300 mb-6">{jobStatus.message}</p>
                        </div>

                        {jobStatus.status === 'processing' && (
                          <>
                            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Clock className="h-6 w-6 text-sky-400" />
                                  <span className="text-lg font-semibold text-slate-100">
                                    Elapsed Time
                                  </span>
                                </div>
                                <span className="text-3xl font-bold text-sky-400">
                                  {formatTime(elapsedTime)}
                                </span>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-sm font-medium text-slate-200 mb-2">
                                <span>Progress</span>
                                <span>
                                  {Math.round((jobStatus.progress || 0) * 100)}
                                  %
                                </span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 h-3 rounded-full transition-all"
                                  style={{ width: `${(jobStatus.progress || 0) * 100}%` }}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <div className="flex gap-4">
                          {jobStatus.status === 'completed' && (
                            <button
                              onClick={handleDownload}
                              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-6 rounded-xl
                              font-semibold hover:from-emerald-500 hover:to-teal-500 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/40"
                            >
                              <Download className="h-5 w-5" />
                              <span>Download Results</span>
                            </button>
                          )}
                          <button
                            onClick={handleReset}
                            className="flex-1 bg-slate-800 text-slate-50 py-3 px-6 rounded-xl
                            font-semibold hover:bg-slate-700 flex items-center justify-center space-x-2"
                          >
                            <RefreshCw className="h-5 w-5" />
                            <span>New Match</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-50 mb-4">Job History</h3>
                    {jobHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <History className="mx-auto h-16 w-16 text-slate-700 mb-4" />
                        <p className="text-slate-400">No history yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {jobHistory.map((job, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-start justify-between"
                          >
                            <div>
                              <h4 className="font-semibold text-slate-50">
                                Job #{job.jobId?.substring(0, 8) || '—'}
                              </h4>
                              <p className="text-xs text-slate-400">
                                {job.timestamp
                                  ? new Date(job.timestamp).toLocaleString()
                                  : 'Unknown date'}
                              </p>
                              <p className="text-xs text-slate-300 mt-2">
                                CBX: {job.cbxFile || '—'} | HC: {job.hcFile || '—'}
                              </p>
                              {job.processingTime && (
                                <p className="text-xs text-slate-400 mt-1">
                                  Duration: {formatTime(job.processingTime)}
                                </p>
                              )}
                              {job.error && (
                                <p className="text-xs text-red-300 mt-1">Error: {job.error}</p>
                              )}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                job.status === 'completed'
                                  ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-600/40'
                                  : 'bg-red-900/40 text-red-300 border border-red-600/40'
                              }`}
                            >
                              {job.status?.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'logs' && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-50 mb-4">System Terminal</h3>

                    <div
                      ref={terminalRef}
                      className="bg-black/90 text-green-400 font-mono text-xs rounded-xl p-4 h-96 overflow-y-auto shadow-inner border border-slate-700"
                    >
                      <div className="text-slate-500 mb-2">
                        <span className="text-emerald-400">system@onboarding</span>:
                        <span className="text-sky-400">~/analysis-tool</span>$
                      </div>
                      {orderedLogs.map(log => (
                        <div key={log.id} className="mb-1 whitespace-pre-wrap">
                          <span className="text-slate-500 pr-2">
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                          </span>

                          <span
                            className={
                              log.type === 'error'
                                ? 'text-red-400'
                                : log.type === 'success'
                                ? 'text-emerald-400'
                                : 'text-sky-400'
                            }
                          >
                            {log.type.toUpperCase()}
                          </span>

                          <span className="text-slate-200"> — {log.message}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setLogs([])}
                      className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Clear Terminal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: current job + recent activity */}
          <div className="space-y-6">
            {/* Current Job Snapshot */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-sky-400" />
                  <h3 className="text-sm font-semibold text-slate-100">
                    Current Job Snapshot
                  </h3>
                </div>
                {jobStatus && (
                  <span
                    className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                      jobStatus.status === 'completed'
                        ? 'bg-emerald-900/40 text-emerald-300'
                        : jobStatus.status === 'failed'
                        ? 'bg-red-900/40 text-red-300'
                        : 'bg-sky-900/40 text-sky-300'
                    }`}
                  >
                    {jobStatus.status.toUpperCase()}
                  </span>
                )}
              </div>

              {jobStatus ? (
                <div className="space-y-2 text-xs text-slate-300">
                  <p>
                    <span className="text-slate-400">Job ID:</span>{' '}
                    <span className="font-mono">
                      {jobId ? jobId.substring(0, 12) + '…' : jobStatus.job_id || '—'}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-400">Message:</span> {jobStatus.message || '—'}
                  </p>
                  <p>
                    <span className="text-slate-400">Elapsed:</span> {formatTime(elapsedTime)}
                  </p>
                  <p>
                    <span className="text-slate-400">Progress:</span>{' '}
                    {Math.round((jobStatus.progress || 0) * 100)}%
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No active job. Start a new match to see live status here.
                </p>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-slate-100">Recent Activity</h3>
                </div>
              </div>

              {logs.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No activity yet. Actions and system events will appear here.
                </p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {logs.slice(0, 5).map(log => (
                    <li key={log.id} className="flex items-start space-x-2">
                      <span
                        className={`mt-0.5 h-2 w-2 rounded-full ${
                          log.type === 'error'
                            ? 'bg-red-400'
                            : log.type === 'success'
                            ? 'bg-emerald-400'
                            : 'bg-sky-400'
                        }`}
                      />
                      <div>
                        <p className="text-slate-200">{log.message}</p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Last Jobs Mini List */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center space-x-2 mb-3">
                <History className="h-4 w-4 text-slate-300" />
                <h3 className="text-sm font-semibold text-slate-100">Last Jobs</h3>
              </div>
              {jobHistory.length === 0 ? (
                <p className="text-xs text-slate-500">No jobs have been run yet.</p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {jobHistory.slice(0, 4).map((job, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between text-slate-300"
                    >
                      <div>
                        <p className="font-medium text-slate-100">
                          #{job.jobId?.substring(0, 8) || '—'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {job.timestamp
                            ? new Date(job.timestamp).toLocaleString()
                            : 'Unknown date'}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          job.status === 'completed'
                            ? 'bg-emerald-900/40 text-emerald-300'
                            : 'bg-red-900/40 text-red-300'
                        }`}
                      >
                        {job.status?.toUpperCase()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
