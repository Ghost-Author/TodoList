import { useEffect, useRef, useState } from 'react';

const useWheelNoticeUndo = ({ onAddOption, onRestoreHistory }) => {
  const [notice, setNotice] = useState('');
  const [undoOption, setUndoOption] = useState(null);
  const [undoHistory, setUndoHistory] = useState(null);
  const noticeTimerRef = useRef(null);
  const undoTimerRef = useRef(null);
  const undoHistoryTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      window.clearTimeout(noticeTimerRef.current);
      window.clearTimeout(undoTimerRef.current);
      window.clearTimeout(undoHistoryTimerRef.current);
    };
  }, []);

  const showNotice = (text) => {
    setNotice(text);
    window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(''), 1500);
  };

  const queueUndoOption = (label) => {
    window.clearTimeout(undoTimerRef.current);
    setUndoOption({ label });
    undoTimerRef.current = window.setTimeout(() => {
      setUndoOption(null);
    }, 5000);
  };

  const handleUndoRemove = async () => {
    if (!undoOption?.label) return;
    const ok = await onAddOption(undoOption.label);
    if (ok !== false) {
      setUndoOption(null);
      window.clearTimeout(undoTimerRef.current);
      showNotice('已撤销删除');
      return;
    }
    showNotice('撤销失败');
  };

  const queueUndoHistory = (items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    window.clearTimeout(undoHistoryTimerRef.current);
    setUndoHistory(items);
    undoHistoryTimerRef.current = window.setTimeout(() => {
      setUndoHistory(null);
    }, 5000);
  };

  const handleUndoHistoryClear = async () => {
    if (!undoHistory || !onRestoreHistory) return;
    const ok = await onRestoreHistory(undoHistory);
    if (ok !== false) {
      setUndoHistory(null);
      window.clearTimeout(undoHistoryTimerRef.current);
      showNotice('已恢复清空记录');
      return;
    }
    showNotice('恢复记录失败');
  };

  return {
    notice,
    undoOption,
    undoHistory,
    showNotice,
    queueUndoOption,
    queueUndoHistory,
    handleUndoRemove,
    handleUndoHistoryClear
  };
};

export default useWheelNoticeUndo;
