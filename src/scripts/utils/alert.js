import Swal from 'sweetalert2';

export async function showLoading(title = 'Loading...') {
  return Swal.fire({
    title,
    allowOutsideClick: false,
    showConfirmButton: false,
    willOpen: () => Swal.showLoading()
  });
}

export async function showSuccess(title = 'Berhasil!', text = '') {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    timer: 2500,
    timerProgressBar: true,
    showConfirmButton: false,
    confirmButtonColor: '#3b82f6',
  });
}

export async function showError(title = 'Error', text = '') {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#ef4444',
  });
}

export async function showConfirm(title = 'Yakin?', text = '') {
  const result = await Swal.fire({
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: 'Ya, lanjutkan',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#94a3b8',
    reverseButtons: true,
  });
  return result.isConfirmed;
}

