type SelectPlatformProps = {}

function SelectPlatform({}: SelectPlatformProps) {
  return <select className="form-select form-select-lg select-filter-mdr w-100 number-font" name="year" id="year">
    <optgroup label="iOS">
      <option value="1971">iPhone 16 (2)</option>
      <option value="1972">iPhone 15 Pro Max (3)</option>
      <option value="1973">iPhone 12 mini (2)</option>
    </optgroup>
    <optgroup label="Android">
      <option value="1971">Samsung Galaxy S25 (1)</option>
      <option value="1972">Samsung Galaxy S23 (5)</option>
      <option value="1973">Google Pixel 9 (1)</option>
    </optgroup>
  </select>
}

export default SelectPlatform