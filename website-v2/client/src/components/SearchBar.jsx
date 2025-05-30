import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Space, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const navigate = useNavigate();
  
  const handleSearch = (value) => {
    if (value.trim()) {
      const searchParams = new URLSearchParams({
        q: value.trim(),
        type: searchType
      });
      navigate(`/search?${searchParams.toString()}`);
    }
  };
  
  return (
    <Space.Compact style={{ width: '100%' }}>
      <Select
        value={searchType}
        onChange={setSearchType}
        style={{ width: '120px' }}
      >
        <Option value="all">All Fields</Option>
        <Option value="title">Title</Option>
        <Option value="author">Author</Option>
        <Option value="abstract">Abstract</Option>
      </Select>
      <Search
        placeholder={`Search by ${searchType}...`}
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