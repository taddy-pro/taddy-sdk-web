const Close = ({ color = 'white' }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5.63059 14.3689L9.99945 10M14.3683 5.63113L9.99945 10M9.99945 10L5.63059 5.63113M9.99945 10L14.3683 14.3689"
      stroke={color}
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export default Close;
