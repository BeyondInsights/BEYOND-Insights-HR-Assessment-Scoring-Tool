// Run this in browser console to add test data
localStorage.setItem('firmographics_data', JSON.stringify({
  s1: 'Test Company',
  s2: 'Technology', 
  s3: '100-500',
  s4a: 'USA',
  companyName: 'Test Company Inc'
}));

localStorage.setItem('general-benefits_data', JSON.stringify({
  gb1: ['Medical', 'Dental'],
  gb2: 'Yes'
}));

localStorage.setItem('current-support_data', JSON.stringify({
  cb3a: 'Yes, we offer additional support beyond legal requirements',
  cb3b: 'Option 1',
  or1: 'Basic support'
}));

// Don't set complete flags, just data
console.log('Test data added!');
console.log('Firmographics:', localStorage.getItem('firmographics_data'));
console.log('General:', localStorage.getItem('general-benefits_data'));
console.log('Current:', localStorage.getItem('current-support_data'));

// Now refresh the page to see if dashboard shows progress
