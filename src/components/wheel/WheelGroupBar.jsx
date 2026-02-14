import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { countChars } from './renderUtils.js';

const WheelGroupBar = ({
  groups,
  currentGroup,
  onGroupChange,
  onAddGroup,
  onRenameGroup,
  onDeleteGroup,
  showNotice,
  maxGroupLength
}) => {
  const [newGroup, setNewGroup] = useState('');
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingName, setEditingName] = useState('');

  const canAddGroup = (value) => {
    const val = String(value || '').trim();
    if (!val) {
      showNotice('请输入分组名称');
      return false;
    }
    if (countChars(val) > maxGroupLength) {
      showNotice(`分组名最多 ${maxGroupLength} 个字符`);
      return false;
    }
    if (val === '随机') {
      showNotice('“随机”为系统分组');
      return false;
    }
    if ((groups || []).includes(val)) {
      showNotice('该分组已存在');
      return false;
    }
    return true;
  };

  const submitNewGroup = async () => {
    if (!canAddGroup(newGroup)) return;
    const ok = await onAddGroup(newGroup.trim());
    if (ok !== false) {
      setNewGroup('');
      showNotice('分组已创建');
    } else {
      showNotice('新建分组失败');
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {groups.map((g) => (
          <div key={g} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onGroupChange(g)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                currentGroup === g
                  ? 'bg-[#ff8acb] text-white border-[#ff8acb] shadow-[0_6px_16px_rgba(255,138,203,0.35)]'
                  : 'bg-white/85 text-[#7b6f8c] border-[#ffe4f2] hover:border-[#ffb6d8]'
              }`}
            >
              {g}
            </button>
            {g !== '随机' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingGroup(g);
                    setEditingName(g);
                  }}
                  className="text-[#7b6f8c] hover:text-[#ff6fb1]"
                  title="重命名"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onDeleteGroup(g);
                  }}
                  className="text-[#7b6f8c] hover:text-red-500"
                  title="删除分组"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        ))}
        <div className="flex items-center gap-2 ml-1">
          <input
            type="text"
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              await submitNewGroup();
            }}
            placeholder="新增分组"
            maxLength={maxGroupLength + 8}
            className="text-xs bg-white/85 rounded-full px-3 py-1 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
          />
          <button
            type="button"
            className="text-xs font-bold text-white bg-[#ff8acb] px-3 py-1 rounded-full shadow-[0_8px_16px_rgba(255,138,203,0.35)]"
            onClick={submitNewGroup}
          >
            新建
          </button>
        </div>
      </div>

      {editingGroup && (
        <div className="mb-4 flex items-center gap-2 text-xs bg-white/85 border border-[#ffe4f2] rounded-xl px-3 py-2">
          <span className="text-[#7b6f8c]">重命名分组：</span>
          <input
            type="text"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            className="flex-1 text-xs bg-transparent outline-none"
          />
          <button
            type="button"
            className="text-xs font-bold text-white bg-[#ff8acb] px-2 py-1 rounded-full"
            onClick={async () => {
              const ok = await onRenameGroup(editingGroup, editingName);
              if (ok !== false) {
                setEditingGroup(null);
                setEditingName('');
              }
            }}
          >
            保存
          </button>
          <button
            type="button"
            className="text-xs text-[#7b6f8c]"
            onClick={() => {
              setEditingGroup(null);
              setEditingName('');
            }}
          >
            取消
          </button>
        </div>
      )}
    </>
  );
};

export default WheelGroupBar;
