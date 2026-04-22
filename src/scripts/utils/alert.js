import Swal from 'sweetalert2';

export async function showLoading(title = 'Loading...') {
  return Swal.fire({
    title,
    allowOutsideClick: false,
    showConfirmButton: false,
    willOpen: () => Swal.showLoading()
  });
}

export async function showSuccess(title = 'Success!', text = '') {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    timer: 2500,
    showConfirmButton: false
  });
}

export async function showError(title = 'Error', text = '') {
  return Swal.fire({
    icon: 'error',
    title,
    text
  });
}

export async function showConfirm(title = 'Confirm?', text = '') {
  const result = await Swal.fire({
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'Cancel'
  });
  return result.isConfirmed;
}

