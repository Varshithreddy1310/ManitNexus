import React from 'react';

const RoleBadge = ({ role }) => {
  if (!role) return null;

  const roleLower = role.toLowerCase();
  
  let className = 'role-badge ';
  let label = '';

  if (roleLower === 'student') {
    className += 'role-badge-student';
    label = 'Student';
  } else if (roleLower === 'alumni') {
    className += 'role-badge-alumni';
    label = 'Alumni';
  } else if (roleLower === 'admin') {
    className += 'role-badge-admin';
    label = 'Admin';
  } else {
    className += 'role-badge-student';
    label = role.toUpperCase();
  }

  return (
    <span className={className}>
      {label}
    </span>
  );
};

export default RoleBadge;
