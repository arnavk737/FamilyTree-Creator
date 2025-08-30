import React, { useState, useRef } from 'react';
import { Plus, Minus, Download, Upload, X, User, Heart, Edit3, Trash2 } from 'lucide-react';

const FamilyTreeApp = () => {
  const [members, setMembers] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditMember, setShowEditMember] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    description: '',
    image: '',
    parents: [],
    partner: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      gender: 'male',
      description: '',
      image: '',
      parents: [],
      partner: ''
    });
  };

  const addMember = () => {
    if (!formData.name.trim()) return;

    const newMember = {
      id: Date.now().toString(),
      name: formData.name,
      gender: formData.gender,
      description: formData.description,
      image: formData.image,
      parents: formData.parents,
      partner: formData.partner,
      children: [],
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 }
    };

    // Update parent's children
    if (formData.parents.length > 0) {
      setMembers(prev => prev.map(member => {
        if (formData.parents.includes(member.id)) {
          return { ...member, children: [...member.children, newMember.id] };
        }
        return member;
      }));
    }

    // Update partner relationship
    if (formData.partner) {
      setMembers(prev => prev.map(member => {
        if (member.id === formData.partner) {
          return { ...member, partner: newMember.id };
        }
        return member;
      }));
    }

    setMembers(prev => [...prev, newMember]);
    setShowAddMember(false);
    resetForm();
  };

  const editMember = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      gender: member.gender,
      description: member.description,
      image: member.image,
      parents: member.parents,
      partner: member.partner
    });
    setShowEditMember(true);
  };

  const updateMember = () => {
    if (!formData.name.trim()) return;

    setMembers(prev => prev.map(member => {
      if (member.id === editingMember.id) {
        // Handle partner changes
        if (member.partner !== formData.partner) {
          // Remove old partner relationship
          if (member.partner) {
            prev.forEach(m => {
              if (m.id === member.partner) {
                m.partner = '';
              }
            });
          }
          // Add new partner relationship
          if (formData.partner) {
            prev.forEach(m => {
              if (m.id === formData.partner) {
                m.partner = member.id;
              }
            });
          }
        }

        // Handle parent changes
        if (JSON.stringify(member.parents) !== JSON.stringify(formData.parents)) {
          // Remove from old parents' children
          member.parents.forEach(parentId => {
            prev.forEach(p => {
              if (p.id === parentId) {
                p.children = p.children.filter(childId => childId !== member.id);
              }
            });
          });
          // Add to new parents' children
          formData.parents.forEach(parentId => {
            prev.forEach(p => {
              if (p.id === parentId && !p.children.includes(member.id)) {
                p.children.push(member.id);
              }
            });
          });
        }

        return {
          ...member,
          name: formData.name,
          gender: formData.gender,
          description: formData.description,
          image: formData.image,
          parents: formData.parents,
          partner: formData.partner
        };
      }
      return member;
    }));

    setShowEditMember(false);
    setEditingMember(null);
    resetForm();
  };

  const removeMember = (memberId) => {
    setMembers(prev => {
      // Remove references to this member from others
      const updated = prev.filter(m => m.id !== memberId).map(member => ({
        ...member,
        children: member.children.filter(childId => childId !== memberId),
        parents: member.parents.filter(parentId => parentId !== memberId),
        partner: member.partner === memberId ? '' : member.partner
      }));
      return updated;
    });
    setSelectedMember(null);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(members, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'family_tree.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          setMembers(imported);
        } catch (error) {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const updateMemberPosition = (id, newPosition) => {
    setMembers(prev => prev.map(member => 
      member.id === id ? { ...member, position: newPosition } : member
    ));
  };

  const getConnectionLines = () => {
    const lines = [];
    
    members.forEach(member => {
      // Draw lines to children
      member.children.forEach(childId => {
        const child = members.find(m => m.id === childId);
        if (child) {
          lines.push({
            type: 'parent-child',
            from: member.position,
            to: child.position,
            key: `${member.id}-${childId}`
          });
        }
      });

      // Draw lines to partner
      if (member.partner) {
        const partner = members.find(m => m.id === member.partner);
        if (partner && member.id < partner.id) { // Avoid duplicate lines
          lines.push({
            type: 'partnership',
            from: member.position,
            to: partner.position,
            key: `${member.id}-${partner.id}`
          });
        }
      }
    });

    return lines;
  };

  return (
    <div className="w-full h-screen bg-gray-100 relative overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20 bg-white rounded-lg shadow-lg p-4 flex gap-2">
        <button
          onClick={() => setShowAddMember(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          <Plus size={16} />
          Add Member
        </button>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          <Upload size={16} />
          Import
        </button>
        
        <button
          onClick={exportData}
          disabled={members.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:bg-gray-400"
        >
          <Download size={16} />
          Export
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={importData}
          className="hidden"
        />
      </div>

      {/* Canvas */}
      <div className="w-full h-full relative">
        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {getConnectionLines().map(line => (
            <line
              key={line.key}
              x1={line.from.x + 75}
              y1={line.from.y + 50}
              x2={line.to.x + 75}
              y2={line.to.y + 50}
              stroke={line.type === 'partnership' ? '#ef4444' : '#3b82f6'}
              strokeWidth={line.type === 'partnership' ? 3 : 2}
              strokeDasharray={line.type === 'partnership' ? '5,5' : 'none'}
            />
          ))}
        </svg>

        {/* Family Members */}
        {members.map(member => (
          <FamilyMemberCard
            key={member.id}
            member={member}
            onPositionChange={updateMemberPosition}
            onSelect={setSelectedMember}
            onRemove={removeMember}
            onEdit={editMember}
            isSelected={selectedMember?.id === member.id}
          />
        ))}

        {/* Empty state */}
        {members.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <User size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-xl mb-2">Start building your family tree</p>
              <p>Click "Add Member" to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <AddEditMemberModal
          title="Add Family Member"
          formData={formData}
          setFormData={setFormData}
          onSubmit={addMember}
          onCancel={() => {
            setShowAddMember(false);
            resetForm();
          }}
          members={members}
          editingMember={null}
        />
      )}

      {/* Edit Member Modal */}
      {showEditMember && (
        <AddEditMemberModal
          title="Edit Family Member"
          formData={formData}
          setFormData={setFormData}
          onSubmit={updateMember}
          onCancel={() => {
            setShowEditMember(false);
            setEditingMember(null);
            resetForm();
          }}
          members={members}
          editingMember={editingMember}
        />
      )}

      {/* Member Details Panel */}
      {selectedMember && (
        <div className="absolute top-4 right-4 z-20 bg-white rounded-lg shadow-lg p-4 w-80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">{selectedMember.name}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => editMember(selectedMember)}
                className="text-blue-500 hover:text-blue-700"
                title="Edit member"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => removeMember(selectedMember.id)}
                className="text-red-500 hover:text-red-700"
                title="Remove member"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <p><strong>Gender:</strong> {selectedMember.gender}</p>
            {selectedMember.description && (
              <p><strong>Description:</strong> {selectedMember.description}</p>
            )}
            {selectedMember.partner && (
              <p><strong>Partner:</strong> {members.find(m => m.id === selectedMember.partner)?.name}</p>
            )}
            {selectedMember.parents.length > 0 && (
              <p><strong>Parents:</strong> {selectedMember.parents.map(parentId => 
                members.find(m => m.id === parentId)?.name
              ).join(', ')}</p>
            )}
            {selectedMember.children.length > 0 && (
              <p><strong>Children:</strong> {selectedMember.children.map(childId => 
                members.find(m => m.id === childId)?.name
              ).join(', ')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AddEditMemberModal = ({ title, formData, setFormData, onSubmit, onCancel, members, editingMember }) => {
  const availablePartners = members.filter(m => 
    m.id !== editingMember?.id && 
    !m.partner && 
    !formData.parents.includes(m.id)
  );

  const availableParents = members.filter(m => 
    m.id !== editingMember?.id && 
    m.id !== formData.partner
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description or notes"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {(members.length > 0 && (!editingMember || availableParents.length > 0)) && (
            <div>
              <label className="block text-sm font-medium mb-1">Parents</label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                {availableParents.map(parent => (
                  <label key={parent.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.parents.includes(parent.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ 
                            ...prev, 
                            parents: [...prev.parents, parent.id]
                          }));
                        } else {
                          setFormData(prev => ({ 
                            ...prev, 
                            parents: prev.parents.filter(id => id !== parent.id)
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{parent.name}</span>
                  </label>
                ))}
                {availableParents.length === 0 && (
                  <p className="text-gray-500 text-sm">No available parents</p>
                )}
              </div>
            </div>
          )}

          {(members.length > 0 && (!editingMember || availablePartners.length > 0)) && (
            <div>
              <label className="block text-sm font-medium mb-1">Partner</label>
              <select
                value={formData.partner}
                onChange={(e) => setFormData(prev => ({ ...prev, partner: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No partner</option>
                {availablePartners.map(partner => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onSubmit}
            disabled={!formData.name.trim()}
            className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400"
          >
            {editingMember ? 'Update Member' : 'Add Member'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const FamilyMemberCard = ({ member, onPositionChange, onSelect, onRemove, onEdit, isSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - member.position.x,
      y: e.clientY - member.position.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      onPositionChange(member.id, {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const genderColor = {
    male: 'bg-blue-100 border-blue-300',
    female: 'bg-pink-100 border-pink-300',
    other: 'bg-purple-100 border-purple-300'
  };

  return (
    <div
      className={`absolute z-10 cursor-move select-none ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{ left: member.position.x, top: member.position.y }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(member);
      }}
    >
      <div className={`w-32 h-24 rounded-lg border-2 p-2 bg-white shadow-md hover:shadow-lg transition-shadow ${
        genderColor[member.gender] || genderColor.other
      } ${isDragging ? 'shadow-xl scale-105' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          {member.image ? (
            <img 
              src={member.image} 
              alt={member.name}
              className="w-6 h-6 rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              member.gender === 'male' ? 'bg-blue-300 text-blue-800' :
              member.gender === 'female' ? 'bg-pink-300 text-pink-800' :
              'bg-purple-300 text-purple-800'
            }`}>
              {member.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          {member.partner && (
            <Heart size={12} className="text-red-500" />
          )}
        </div>
        
        <div className="text-xs font-semibold truncate">{member.name}</div>
        
        {member.description && (
          <div className="text-xs text-gray-600 truncate mt-1">
            {member.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyTreeApp;