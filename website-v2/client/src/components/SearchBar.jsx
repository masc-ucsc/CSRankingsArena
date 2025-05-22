import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Search } = Input;

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  
  const handleSearch = (value) => {
    if (value.trim()) {
      const searchParams = new URLSearchParams({
        q: value.trim()
      });
      navigate(`/search?${searchParams.toString()}`);
    }
  };
  
  return (
    <Space.Compact style={{ width: '100%' }}>
      <Search
        placeholder="Search by title..."
        allowClear
        enterButton={<SearchOutlined />}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onSearch={handleSearch}
      />
    </Space.Compact>
  );
};

export default SearchBar;